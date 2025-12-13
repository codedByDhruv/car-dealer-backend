const User = require('../models/User');
const Car = require('../models/Car');
const Sold = require('../models/Sold');
const { success, error } = require('../utils/response');
const mongoose = require("mongoose");

// ==========================
// Validate ObjectId helper
// ==========================
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================
// Dashboard Stats
// ==========================
exports.getStats = async (req, res) => {
  try {
    const [usersCount, carsCount, soldCount] = await Promise.all([
      User.countDocuments({ role: "user" }),        // exclude admin
      Car.countDocuments({ isDeleted: false }),
      Sold.countDocuments()
    ]);

    return success(res, "🔹 Dashboard statistics loaded successfully", {
      usersCount,
      carsCount,
      soldCount
    });

  } catch (err) {
    return error(res, "❌ Failed to load dashboard statistics", err.message);
  }
};

// ==========================
// List Users
// ==========================
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }) // exclude admin
      .select("-password")
      .sort({ createdAt: -1 });

    if (users.length === 0)
      return success(res, "⚠️ No users found", []);

    return success(res, "🔹 Users fetched successfully", users);

  } catch (err) {
    return error(res, "❌ Failed to fetch users", err.message);
  }
};

// ==========================
// Block User
// ==========================
exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id))
      return error(res, "❌ Invalid User ID");

    const user = await User.findByIdAndUpdate(id, { isBlocked: true }, { new: true });

    if (!user)
      return error(res, "⚠️ User not found");

    return success(res, "🛑 User has been blocked successfully", user);

  } catch (err) {
    return error(res, "❌ Failed to block user", err.message);
  }
};

// ==========================
// Unblock User
// ==========================
exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id))
      return error(res, "❌ Invalid User ID");

    const user = await User.findByIdAndUpdate(id, { isBlocked: false }, { new: true });

    if (!user)
      return error(res, "⚠️ User not found");

    return success(res, "✅ User has been unblocked successfully", user);

  } catch (err) {
    return error(res, "❌ Failed to unblock user", err.message);
  }
};

// ==========================
// Add Sold Car Entry (Admin)
// ==========================
exports.addSold = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      car,
      soldPrice,
      paymentMode,
      remarks,
      soldDate,
      buyer,
    } = req.body;

    // ==========================
    // Basic Validation
    // ==========================
    if (!car || !soldPrice || !paymentMode || !buyer) {
      return error(res, "❌ Missing required fields");
    }

    if (!isValidId(car)) {
      return error(res, "❌ Invalid Car ID");
    }

    const carExists = await Car.findById(car);
    if (!carExists) {
      return error(res, "⚠️ Car not found");
    }

    if (carExists.isSold) {
      return error(res, "⚠️ This car is already sold");
    }

    // ==========================
    // ID Proof Image (STRICT)
    // ==========================
    if (!req.file || !req.file.path) {
      return error(res, "❌ ID proof image is required");
    }

    const fixedPath = req.file.path.replace(/\\/g, "/");
    const relative = fixedPath.split("uploads/")[1];

    if (!relative) {
      return error(res, "❌ Invalid ID proof image path");
    }

    // ✅ EXACTLY ONE IMAGE
    const idProofImages = ["/uploads/" + relative];

    // ==========================
    // Build Buyer Object
    // ==========================
    const finalBuyer = {
      fullName: buyer.fullName,
      mobileNumber: buyer.mobileNumber,
      email: buyer.email,
      address: {
        street: buyer.address?.street,
        city: buyer.address?.city,
        state: buyer.address?.state,
        pincode: buyer.address?.pincode,
      },
      idProof: {
        type: buyer.idProof?.type,
        number: buyer.idProof?.number,
        images: idProofImages, // 🔥 REQUIRED BY SCHEMA
      },
    };

    // ==========================
    // Final Buyer Validation
    // ==========================
    if (
      !finalBuyer.fullName ||
      !finalBuyer.mobileNumber ||
      !finalBuyer.idProof.type ||
      !finalBuyer.idProof.number ||
      finalBuyer.idProof.images.length !== 1
    ) {
      return error(res, "❌ Buyer details are incomplete");
    }

    // ==========================
    // Create Sold Record
    // ==========================
    const soldRecord = await Sold.create({
      car,
      buyer: finalBuyer,
      soldPrice,
      paymentMode,
      remarks,
      soldDate,
    });

    // ==========================
    // Mark Car as SOLD
    // ==========================
    await Car.findByIdAndUpdate(car, { isSold: true });

    return success(
      res,
      "🚗 Sold car entry added successfully",
      soldRecord,
      201
    );

  } catch (err) {
    console.error(err);
    return error(
      res,
      "❌ Failed to add sold car entry",
      err.message
    );
  }
};

// ==========================
// List Sold Cars
// ==========================
exports.listSold = async (req, res) => {
  try {
    const sold = await Sold.find()
      .populate("car")
      .sort({ date: -1 });

    if (sold.length === 0)
      return success(res, "⚠️ No sold car records found", []);

    return success(res, "🔹 Sold cars list fetched successfully", sold);

  } catch (err) {
    return error(res, "❌ Failed to fetch sold cars list", err.message);
  }
};
