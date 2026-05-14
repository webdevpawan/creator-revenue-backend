const razorpay = require('../config/razorpay');

exports.createOrder = async (req, res) => {

  try {

    const { amount, plan } = req.body;

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

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