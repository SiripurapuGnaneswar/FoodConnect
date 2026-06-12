const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  updateStatus,
} = require("../controllers/donationController");

router.post("/", protect, createDonation);

router.get("/", getDonations);

router.get("/:id", getDonationById);

router.put("/:id", protect, updateDonation);

router.delete("/:id", protect, deleteDonation);

router.put("/:id/status", protect, updateStatus);

module.exports = router;