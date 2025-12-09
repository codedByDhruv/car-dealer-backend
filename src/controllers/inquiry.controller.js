const Inquiry = require("../models/Inquiry");
const Car = require("../models/Car");
const mongoose = require("mongoose");
const { success, error } = require("../utils/response");

// ==========================
// Validate ObjectId helper
// ==========================
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================
// Send Inquiry
// ==========================
exports.sendInquiry = async (req, res) => {
  try {
    const { carId, name, phone, message } = req.body;

    // Required fields check
    if (!carId || !name || !phone) {
      return error(res, "❌ Missing required fields: carId, name, phone");
    }

    if (!isValidId(carId)) {
      return error(res, "❌ Invalid Car ID");
    }

    // Check car existence
    const car = await Car.findById(carId);
    if (!car || car.isDeleted) {
      return error(res, "⚠️ Car not found", null, 404);
    }

    // Create inquiry
    const inquiry = await Inquiry.create({
      user: req.user ? req.user._id : null, // optional user (guest allowed)
      car: carId,
      name,
      phone,
      message: message || "",
    });

    return success(res, "📩 Inquiry sent successfully", inquiry, 201);

  } catch (err) {
    return error(res, "❌ Failed to send inquiry", err.message);
  }
};

// ==========================
// List User Inquiries
// ==========================
exports.listUserInquiries = async (req, res) => {
  try {
    if (!req.user) {
      return error(res, "❌ Unauthorized: User not logged in", null, 401);
    }

    const inquiries = await Inquiry.find({ user: req.user._id })
      .populate("car")
      .sort({ createdAt: -1 });

    return success(res, "📋 User inquiries fetched successfully", inquiries);

  } catch (err) {
    return error(res, "❌ Failed to fetch user inquiries", err.message);
  }
};

// ==========================
// Admin - List All Inquiries
// ==========================
exports.listAll = async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate("user", "-password")
      .populate("car")
      .sort({ createdAt: -1 });

    return success(res, "📋 All inquiries fetched successfully", inquiries);

  } catch (err) {
    return error(res, "❌ Failed to fetch all inquiries", err.message);
  }
};

// ==========================
// Update Inquiry Status
// ==========================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return error(res, "❌ Invalid Inquiry ID");
    }

    if (!status) {
      return error(res, "❌ Status is required");
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!inquiry) {
      return error(res, "⚠️ Inquiry not found", null, 404);
    }

    return success(res, "⚙️ Inquiry status updated successfully", inquiry);

  } catch (err) {
    return error(res, "❌ Failed to update inquiry status", err.message);
  }
};
