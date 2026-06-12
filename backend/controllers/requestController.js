const Request = require("../models/Request");
const Donation = require("../models/Donation");

// NGO Requests Donation
const createRequest = async (req, res) => {
  try {
    const { donationId } = req.body;

    if (req.user.role !== "ngo") {
      return res.status(403).json({
        message: "Only NGOs may request pickups",
      });
    }

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (donation.donorId.toString() === req.user.id) {
      return res.status(400).json({
        message: "You cannot request pickup for your own donation",
      });
    }

    const existing = await Request.findOne({ donationId, ngoId: req.user.id });
    if (existing) {
      return res.status(400).json({
        message: "You have already requested this donation",
      });
    }

    const request = await Request.create({
      donationId,
      ngoId: req.user.id,
    });

    donation.status = "Requested";
    await donation.save();

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json(error);
  }
};

// Get NGO Requests
const getRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate({
        path: "donationId",
        populate: { path: "donorId", select: "name email" },
      })
      .populate("ngoId", "name email");

    res.json(requests);
  } catch (error) {
    res.status(500).json(error);
  }
};

// Donor Accept Request
const acceptRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("donationId");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (!request.donationId) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (request.donationId.donorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only the donating organization can accept pickups",
      });
    }

    request.status = "Accepted";
    await request.save();

    const donation = await Donation.findById(request.donationId._id);

    donation.status = "Accepted";

    await donation.save();

    res.json({
      message: "Request Accepted",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  acceptRequest,
};