const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    // Match controller: name, brand, model, price, year, description
    name: { type: String, required: true },          // e.g., "Toyota Corolla 2018"
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },

    kmDriven: { type: Number },
    fuelType: { type: String },
    transmission: { type: String },

    price: { type: Number, required: true },
    ownerCount: { type: Number },

    description: { type: String },
    features: [{ type: String }],

    condition: {
      type: String,
      enum: ['new', 'used', 'certified'],
      default: 'used',
    },

    images: [{ type: String }], // Array of file paths

    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
  },
  { timestamps: true }
);

module.exports = mongoose.model('Car', carSchema);
