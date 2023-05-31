import express from 'express'
import { isAuthenticated } from '../middlewares/auth.js';
import { buySubscription, cancelSubscription, getRazorPayKey, paymentVerfication } from '../controllers/paymentController.js';

const router = express.Router();

//Buy Subscription
router.route("/subscribe").get(isAuthenticated,buySubscription)

//payment verification
router.route("/paymentverification").post(isAuthenticated,paymentVerfication)

// get razorpay key
router.route("/razorpaykey").get(getRazorPayKey);

// cancel Subscription
router.route('/subscribe/cancel').delete(isAuthenticated,cancelSubscription)


export default router;