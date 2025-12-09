const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false                 // Optional for guest users
  },

  car: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Car',
    required: true 
  },

  name: { type: String },
  email: { type: String },
  phone: { type: String },
  message: { type: String },

  status: { 
    type: String, 
    enum: ['pending', 'viewed', 'contacted'], 
    default: 'pending' 
  },

}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
