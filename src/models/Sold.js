const mongoose = require("mongoose");

const soldSchema = new mongoose.Schema(
  {
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },

    // ==========================
    // Buyer Details
    // ==========================
    buyer: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      mobileNumber: {
        type: String,
        required: true,
        match: /^[6-9]\d{9}$/, // Indian mobile validation
      },

      email: {
        type: String,
        lowercase: true,
        trim: true,
      },

      address: {
        street: String,
        city: String,
        state: String,
        pincode: {
          type: String,
          match: /^\d{6}$/,
        },
      },

      idProof: {
        type: {
          type: String,
          enum: ["Aadhar", "PAN", "Driving License", "Passport"],
          required: true,
        },

        number: {
          type: String,
          required: true,
        },

        // ✅ FIXED HERE (ARRAY VALIDATION)
        images: {
          type: [String],
          required: true,
          validate: {
            validator: function (v) {
              return Array.isArray(v) && v.length === 1;
            },
            message: "Exactly one ID proof image is required",
          },
        },
      },
    },

    // ==========================
    // Sale Details
    // ==========================
    soldPrice: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Cheque"],
      required: true,
    },

    remarks: String,

    soldDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sold", soldSchema);
