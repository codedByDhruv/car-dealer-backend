const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../models/User');
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    // ================================
    // CREATE DEFAULT ADMIN USER (ONE TIME)
    // ================================
    const adminEmail = "dhruvstackdev@gmail.com";  
    const adminPassword = "Admin@123";             

    // check if any admin already exists
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isBlocked: false,
      });

      console.log("🛠️ Default Admin Created:");
      console.log("Email:", adminEmail);
      console.log("Password:", adminPassword);
    } else {
      console.log("ℹ️ Admin already exists, skipping creation");
    }

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
