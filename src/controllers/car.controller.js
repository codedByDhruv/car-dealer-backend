const Car = require("../models/Car");
const mongoose = require("mongoose");
const { success, error } = require("../utils/response");

// ==========================
// Validate ObjectId helper
// ==========================
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================
// Add Car (Admin)
// ==========================
exports.addCar = async (req, res) => {
  try {
    const { name, brand, model, price, year, description } = req.body;

    // ==========================
    // Required Fields Check
    // ==========================
    if (!name || !brand || !model || !price || !year) {
      return error(
        res,
        "❌ Missing required fields: name, brand, model, price, year"
      );
    }

    // ==========================
    // Image Upload Handling
    // ==========================
    const images = (req.files || []).map((file) => {
      const fixed = file.path.replace(/\\/g, "/");               // fix windows paths
      const relative = fixed.split("uploads/")[1];               // keep only path after uploads/
      return "/uploads/" + relative;                             // final clean path
    });

    const car = await Car.create({
      ...req.body,
      images,
      isDeleted: false,
    });

    return success(res, "🚗 Car added successfully", car, 201);

  } catch (err) {
    return error(res, "❌ Failed to add car", err.message);
  }
};

// ==========================
// List Cars (Public)
// ==========================
exports.listCars = async (req, res) => {
  try {
    let { page = 1, limit = 12, q, brand, minPrice, maxPrice } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;
    const filter = { isDeleted: false };

    // Text Search
    if (q) filter.$text = { $search: q };

    // Brand Filter
    if (brand) filter.brand = brand;

    // Price Range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const [cars, total] = await Promise.all([
      Car.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Car.countDocuments(filter),
    ]);

    return success(res, "🚗 Cars fetched successfully", {
      cars,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    return error(res, "❌ Failed to fetch cars", err.message);
  }
};

// ==========================
// Get Single Car
// ==========================
exports.getCar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id))
      return error(res, "❌ Invalid Car ID");

    const car = await Car.findById(id);

    if (!car || car.isDeleted)
      return error(res, "⚠️ Car not found", null, 404);

    return success(res, "🚗 Car fetched successfully", car);

  } catch (err) {
    return error(res, "❌ Failed to fetch car", err.message);
  }
};
// ==========================
// Update Car
// ==========================
exports.updateCar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) return error(res, "❌ Invalid Car ID");

    // Find existing car first (we need current images)
    const car = await Car.findById(id);
    if (!car) return error(res, "⚠️ Car not found", null, 404);

    // Clone body fields (excluding images logic)
    const updates = { ...req.body };

    // Parse stayImages and removeImages from body (they may come as string from form-data)
    let stayImages = [];
    if (req.body.stayImages) {
      try {
        // if frontend sends JSON string
        stayImages = Array.isArray(req.body.stayImages)
          ? req.body.stayImages
          : JSON.parse(req.body.stayImages);
      } catch {
        // or comma-separated string fallback
        stayImages = req.body.stayImages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } else {
      // if not provided, assume all existing images are kept
      stayImages = car.images || [];
    }

    // Optional removeImages (just for later file deletion if needed)
    let removeImages = [];
    if (req.body.removeImages) {
      try {
        removeImages = Array.isArray(req.body.removeImages)
          ? req.body.removeImages
          : JSON.parse(req.body.removeImages);
      } catch {
        removeImages = req.body.removeImages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Filter stayImages to ensure they belong to this car (security)
    const validStayImages = (car.images || []).filter((img) =>
      stayImages.includes(img)
    );

    // Handle NEW uploaded images (with relative paths)
    const newImages = (req.files || []).map((file) => {
      const fixed = file.path.replace(/\\/g, "/");     // D:\... → D:/...
      const relative = fixed.split("uploads/")[1];     // cars/xxx.avif
      return "/uploads/" + relative;                   // /uploads/cars/xxx.avif
    });

    // Final images = kept old images + new uploads
    updates.images = [...validStayImages, ...newImages];

    // Now actually update car
    const updatedCar = await Car.findByIdAndUpdate(id, updates, { new: true });

    return success(res, "🔄 Car updated successfully", updatedCar);
  } catch (err) {
    return error(res, "❌ Failed to update car", err.message);
  }
};

// ==========================
// Soft Delete Car
// ==========================
exports.deleteCar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id))
      return error(res, "❌ Invalid Car ID");

    const car = await Car.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!car)
      return error(res, "⚠️ Car not found", null, 404);

    return success(res, "🗑️ Car deleted successfully");

  } catch (err) {
    return error(res, "❌ Failed to delete car", err.message);
  }
};
