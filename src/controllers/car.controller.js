const fs = require("fs");
const path = require("path");
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
// List Cars (Public + Admin)
// ==========================
exports.listCars = async (req, res) => {
  try {
    let { page = 1, limit = 12, q, brand, minPrice, maxPrice } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;
    const filter = { 
      isDeleted: false,
      isSold: false
    };

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

    // 1️⃣ Get existing car
    const car = await Car.findById(id);
    if (!car) return error(res, "⚠️ Car not found", null, 404);

    // 2️⃣ Clone body fields (except internal helpers)
    const updates = { ...req.body };
    delete updates.deletesImage; // don't save this field in DB

    // 3️⃣ Parse deletesImage from body
    // deletesImage: ["/uploads/cars/abc.jpg", "/uploads/cars/xyz.png"]
    let deletesImage = [];
    if (req.body.deletesImage) {
      try {
        deletesImage = Array.isArray(req.body.deletesImage)
          ? req.body.deletesImage
          : JSON.parse(req.body.deletesImage);
      } catch {
        deletesImage = req.body.deletesImage
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const existingImages = car.images || [];

    // 4️⃣ Which existing images to keep/remove
    const imagesToRemove = existingImages.filter((img) =>
      deletesImage.includes(img)
    );

    const keptImages = existingImages.filter(
      (img) => !deletesImage.includes(img)
    );

    // 5️⃣ Handle new uploaded images (multer)
    const newImages = (req.files || []).map((file) => {
      const fixed = file.path.replace(/\\/g, "/");   // D:\... → D:/...
      const relative = fixed.split("uploads/")[1];   // cars/xxx.avif
      return "/uploads/" + relative;                // /uploads/cars/xxx.avif
    });

    // 6️⃣ Final images: kept old + new
    updates.images = [...keptImages, ...newImages];

    // 7️⃣ Update DB
    const updatedCar = await Car.findByIdAndUpdate(id, updates, { new: true });

    // 8️⃣ Delete removed files from disk (non-blocking)
    if (imagesToRemove.length > 0) {
      const uploadsRoot = path.join(
        __dirname,
        "..",
        "..",
        process.env.UPLOAD_DIR || "uploads"
      );

      imagesToRemove.forEach((imgPath) => {
        try {
          // imgPath like "/uploads/cars/xxx.jpg"
          const relative = imgPath.replace("/uploads/", ""); // cars/xxx.jpg
          const filePath = path.join(uploadsRoot, relative);

          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) console.error("Failed to delete image:", filePath, err);
            });
          }
        } catch (e) {
          console.error("Error while deleting image file:", imgPath, e);
        }
      });
    }

    return success(res, "🔄 Car updated successfully", updatedCar);
  } catch (err) {
    console.error("Update Car Error:", err);
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
