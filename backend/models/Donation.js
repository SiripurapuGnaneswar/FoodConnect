const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    foodName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
    },

    pickupInstructions: {
      type: String,
    },

    location: {
      type: String,
      required: true,
    },

    expiryTime: {
      type: Date,
      required: true,
    },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["Available", "Requested", "Accepted", "Picked Up", "Delivered"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);