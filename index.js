
const express = require("express");
const dotenv = require("dotenv");
const db = require('./config/dbconnect')
const cors = require('cors');

const tokenVerify = require('./middlewares/tokenVerify')

const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

// const allowedOrigins = [
//   "http://localhost:4200",
//   "https://creator-revenue-frontend-o9xun3xg2-webdevpawans-projects.vercel.app",
//   "https://creator-revenue-frontend-3la1ld9jf-webdevpawans-projects.vercel.app/",
//   "https://creator-revenue-frontend.vercel.app" // add your main vercel domain too
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));


app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
// routes

app.get("/", (req, res) => {
    res.json("hello world")
})

app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/dashboard', require('./routes/dashboard.route'));

app.use('/api/links', require('./routes/link.route'));
app.use('/api/conversions', require('./routes/conversion.route'));
app.use('/r', require('./routes/redirect.route'));


app.get("/me", tokenVerify, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});



app.get("/users", tokenVerify , (req, res) => {

  const sql = "SELECT id, name, email FROM users";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err.message
      });
    }

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result
    });
  });

});

app.post("/logout", (req, res) => {

  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // production me true
    sameSite: "lax"
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
});

// Server 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});