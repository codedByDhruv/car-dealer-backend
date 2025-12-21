const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendMail } = require("../utils/email");
const { success, error } = require("../utils/response");

// --------------------------- TOKEN HELPER --------------------------- //
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// --------------------------- REGISTER --------------------------- //
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return error(res, "Missing required fields", null, 400);
    }

    const exists = await User.findOne({ email });
    if (exists) return error(res, "Email already in use", null, 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

    return success(
      res,
      "User registered successfully",
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      201
    );

  } catch (err) {
    return error(res, "Registration failed", err.message);
  }
};

// --------------------------- LOGIN --------------------------- //
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, "Missing fields", null, 400);
    }

    const user = await User.findOne({ email });
    if (!user) return error(res, "Invalid credentials", null, 400);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, "Invalid credentials", null, 400);

    const token = signToken(user);

    return success(res, "Login successful", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.mobile,
        role: user.role,
      },
    });

  } catch (err) {
    return error(res, "Login failed", err.message);
  }
};

// --------------------------- SEND RESET OTP --------------------------- //
exports.sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, "User not found", null, 404);

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    user.resetOtpVerified = false;

    await user.save();

    await sendMail({
      to: email,
      subject: "Carvanta Password Reset OTP",
      text: `Your Carvanta password reset OTP is ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
          <div style="max-width:520px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
            
            <div style="background:#111827; padding:20px; text-align:center;">
              <h1 style="color:#ffffff; margin:0;">Carvanta</h1>
              <p style="color:#9ca3af; margin:4px 0 0;">Buy & Sell Cars Easily</p>
            </div>

            <div style="padding:30px; color:#111827;">
              <h2 style="margin-top:0;">Password Reset Request</h2>

              <p>
                We received a request to reset your password.  
                Use the OTP below to continue:
              </p>

              <div style="
                font-size:28px;
                font-weight:bold;
                letter-spacing:4px;
                background:#f3f4f6;
                padding:15px;
                text-align:center;
                border-radius:6px;
                margin:20px 0;
              ">
                ${otp}
              </div>

              <p style="font-size:14px; color:#6b7280;">
                This OTP is valid for <strong>10 minutes</strong>.  
                If you didn’t request a password reset, please ignore this email.
              </p>

              <p style="margin-top:30px;">
                Regards,<br/>
                <strong>Team Carvanta</strong>
              </p>
            </div>

            <div style="background:#f9fafb; padding:15px; text-align:center; font-size:12px; color:#6b7280;">
              © ${new Date().getFullYear()} Carvanta. All rights reserved.
            </div>

          </div>
        </div>
      `,
    });

    return success(res, "OTP sent to email");
  } catch (err) {
    return error(res, "Failed to send OTP", err.message);
  }
};

// --------------------------- VERIFY RESET OTP --------------------------- //
exports.verifyResetOtpOnly = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, "User not found", null, 404);

    if (!user.resetOtp || user.resetOtp !== otp) {
      return error(res, "Invalid OTP", null, 400);
    }

    if (user.resetOtpExpires < Date.now()) {
      return error(res, "OTP expired", null, 400);
    }

    user.resetOtpVerified = true;
    await user.save();

    return success(res, "OTP verified");

  } catch (err) {
    return error(res, "OTP verification failed", err.message);
  }
};

// --------------------------- RESET PASSWORD --------------------------- //
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, "User not found", null, 404);

    if (!user.resetOtpVerified)
      return error(res, "OTP verification required", null, 403);

    user.password = await bcrypt.hash(newPassword, 10);

    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpVerified = undefined;

    await user.save();

    return success(res, "Password reset successfully");

  } catch (err) {
    return error(res, "Reset failed", err.message);
  }
};

// --------------------------- CHANGE PASSWORD --------------------------- //
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return error(res, "Incorrect old password", null, 400);

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return success(res, "Password changed successfully");

  } catch (err) {
    return error(res, "Failed to change password", err.message);
  }
};
