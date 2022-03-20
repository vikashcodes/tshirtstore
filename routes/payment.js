const express = require("express");
const { sendStripeKey, sendRazorpayKey, captureStripePayment, captureRazorpayPayment } = require("../controllers/paymentController");
const router = express.Router();
const { isLoggedIn } = require("../midlewares/user");

router.route("/stripekey").get(isLoggedIn, sendStripeKey);
router.route("/razorpaykey").get(isLoggedIn, sendRazorpayKey);

router.route("/capturestripe").get(isLoggedIn, captureStripePayment);
router.route("/capturerazorpay").get(isLoggedIn, captureRazorpayPayment);

module.exports = router;
