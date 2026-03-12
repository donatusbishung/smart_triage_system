const express = require("express");
const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middleware/auth");
const { analyzeTicket } = require("../services/aiService");

const router = express.Router();

const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

/**
 * POST /api/tickets
 * Create a new ticket (public — no auth required)
 * AI auto-assigns category and priority
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, description } = req.body;

    if (!name || !email || !subject || !description) {
      return res.status(400).json({
        error: "name, email, subject, and description are all required.",
      });
    }

    // Call AI to analyze the ticket
    const { category, priority } = await analyzeTicket(subject, description);

    const ticket = await Ticket.create({
      title: subject,
      description,
      customer_email: email,
      customer_name: name,
      category,
      priority,
      status: "open",
    });

    res.status(201).json({
      message: "Ticket created successfully.",
      ticket,
    });
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ error: "Server error while creating ticket." });
  }
});

/**
 * GET /api/tickets
 * Get paginated list of tickets (auth required)
 * Query params: page, limit, status, priority
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filter with validation
    const filter = {};
    if (req.query.status) {
      if (!VALID_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      if (!VALID_PRIORITIES.includes(req.query.priority)) {
        return res.status(400).json({
          error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`,
        });
      }
      filter.priority = req.query.priority;
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get tickets error:", err);
    res.status(500).json({ error: "Server error while fetching tickets." });
  }
});

/**
 * GET /api/tickets/:id
 * Get a single ticket by ID (auth required)
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ticket ID format." });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    res.json({ ticket });
  } catch (err) {
    console.error("Get ticket error:", err);
    res.status(500).json({ error: "Server error while fetching ticket." });
  }
});

/**
 * PATCH /api/tickets/:id
 * Update ticket status (auth required)
 */
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ticket ID format." });
    }
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    res.json({
      message: "Ticket updated successfully.",
      ticket,
    });
  } catch (err) {
    console.error("Update ticket error:", err);
    res.status(500).json({ error: "Server error while updating ticket." });
  }
});

module.exports = router;
