const Donation = require("../models/Donation");


// CREATE DONATION
const createDonation = async (req, res) => {
  try {
    const donation = await Donation.create({
      foodName: req.body.foodName,
      quantity: req.body.quantity,
      description: req.body.description,
      pickupInstructions: req.body.pickupInstructions,
      location: req.body.location,
      expiryTime: req.body.expiryTime,
      donorId: req.user.id,
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET ALL DONATIONS
const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("donorId", "name email");

    res.json(donations);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET SINGLE DONATION
const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate("donorId", "name email");

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE DONATION
const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (donation.donorId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const updatedDonation = await Donation.findByIdAndUpdate(
      req.params.id,
      {
        foodName: req.body.foodName,
        quantity: req.body.quantity,
        description: req.body.description,
        pickupInstructions: req.body.pickupInstructions,
        location: req.body.location,
        expiryTime: req.body.expiryTime,
      },
      {
        new: true,
      }
    );

    res.json(updatedDonation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// DELETE DONATION
const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (donation.donorId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await donation.deleteOne();

    res.json({
      message: "Donation deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// UPDATE STATUS
const updateStatus = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (donation.donorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    donation.status = req.body.status;

    await donation.save();

    res.json({
      message: "Status updated successfully",
      donation,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  updateStatus,
};