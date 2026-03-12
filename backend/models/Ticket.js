const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title/subject is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    customer_email: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true,
    },
    customer_name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    category: {
      type: String,
      default: "General Inquiry",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for common query patterns
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });

// Virtual to expose a short ticket ID like TRG-001
ticketSchema.virtual("ticketId").get(function () {
  const num = this._id.toString().slice(-4).toUpperCase();
  return `TRG-${num}`;
});

// Ensure virtuals are included in JSON output
ticketSchema.set("toJSON", { virtuals: true });
ticketSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Ticket", ticketSchema);
