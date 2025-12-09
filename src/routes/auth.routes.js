const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

// Auth
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);

// Forgot Password Flow
router.post('/send-reset-otp', authCtrl.sendResetOtp);              // Step 1
router.post('/verify-reset-otp', authCtrl.verifyResetOtpOnly);      // Step 2 → marks OTP verified
router.post('/reset-password', authCtrl.resetPassword);             // Step 3 → password reset

// Logged-in user change password
router.post('/change-password', auth, authCtrl.changePassword);

module.exports = router;
