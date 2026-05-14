const db = require('../config/dbconnect');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
exports.createOrder = async (req, res) => {

  try {
    const userId = req.user.id;
    const { amount, plan } = req.body;
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    await db.query(
      `
      INSERT INTO payments
      (
        user_id,
        razorpay_order_id,
        plan_name,
        amount,
        status
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        userId,
        order.id,
        plan,
        amount,
        'created'
      ]
    );

    res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Order creation failed'
    });
  }

};


exports.verifyPayment = async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic =
      expectedSignature === razorpay_signature;

    if (!isAuthentic) {

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });

    }

    await db.query(
      `
      UPDATE payments
      SET
        razorpay_payment_id = ?,
        status = 'paid'
      WHERE razorpay_order_id = ?
      `,
      [
        razorpay_payment_id,
        razorpay_order_id
      ]
    );


    await db.query(
      `
      UPDATE users
      SET plan = ?
      WHERE id = ?
      `,
      [
        plan,
        req.user.id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Payment successful'
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });

  }
};