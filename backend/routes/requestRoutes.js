const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createRequest,
  getRequests,
  acceptRequest,
} = require("../controllers/requestController");

router.post("/", protect, createRequest);

router.get("/", protect, getRequests);

router.put("/:id/accept", protect, acceptRequest);

module.exports = router;