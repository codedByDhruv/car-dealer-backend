const mongoose = require('mongoose');

const soldSchema = new mongoose.Schema({
  car: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Car', 
    required: true 
  },

  buyerName: { type: String },
  soldPrice: { type: Number },

  paymentMode: { type: String },       // e.g., Cash, UPI, Bank Transfer
  remarks: { type: String },

  date: { type: Date, default: Date.now },

}, { timestamps: true });

module.exports = mongoose.model('Sold', soldSchema);
