const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/dbconnect");
const sendEmail = require('../services/mailService');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    await sendEmail({
      to: email,
      subject: 'Welcome to Creator Revenue',
      html: `
    <h2>Welcome ${name} 👋</h2>
    <p>Your account has been created successfully.</p>
    <p>Start tracking your creator revenue now.</p> `
    });

    return res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
      code: 201,
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found", code: 400 });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password", code: 400 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 3600000,
    });

    await sendEmail({
      to: user.email,
      subject: 'New Login Detected',
      html: `
    <h2>Hello ${user.name}</h2>
    <p>You logged into your account successfully.</p>`
    });

    return res.json({ message: "Login Successful", code: 200, name: user.name, userId: user.id });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      message: "Logout Successful",
      code: 200,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


exports.googleLogin = async (req, res) => {

  try {

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Google token missing'
      });
    }

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const {
      email,
      name,
      picture,
      sub
    } = payload;

    // Find user
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let user;
    let isNewUser = false;

    // Create user if not exists
    if (users.length === 0) {
      isNewUser = true;
      const [result] = await db.query(
        `
        INSERT INTO users
        (name, email, google_id, avatar, provider)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          name,
          email,
          sub,
          picture,
          'google'
        ]
      );
      user = {
        id: result.insertId,
        email,
        name
      };
    } else {
      user = users[0];
    }
    // JWT
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );
    // Cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production'
        ? 'none'
        : 'lax',
      maxAge: 3600000,
    });

    // Send Email
    if (isNewUser) {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Creator Revenue 🚀',
        html: `
          <h2>Welcome ${user.name}</h2>

          <p>
            Your account has been created successfully using Google Login.
          </p>

          <p>
            Welcome to Creator Revenue 🚀
          </p>
        `
      });
    } else {
      await sendEmail({
        to: user.email,
        subject: 'New Login Detected',
        html: `
          <h2>Hello ${user.name}</h2>

          <p>
            You logged into your account successfully.
          </p>
        `
      });
    }

    return res.json({
      message: "Login Successful",
      code: 200,
      name: user.name,
      userId: user.id
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: 'Google login failed',
      error: error.message
    });
  }
};