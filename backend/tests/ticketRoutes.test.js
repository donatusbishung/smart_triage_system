const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const ticketRoutes = require("../routes/ticketRoutes");
const Ticket = require("../models/Ticket");
const { analyzeTicket } = require("../services/aiService");
const jwt = require("jsonwebtoken");

// Mock the AI service
jest.mock("../services/aiService");

// Mock the auth middleware to simplify testing
jest.mock("../middleware/auth", () => (req, res, next) => {
  req.user = { id: "test-user-id" };
  next();
});

const app = express();
app.use(express.json());
app.use("/api/tickets", ticketRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Ticket.deleteMany({});
  jest.clearAllMocks();
});

describe("Ticket Routes", () => {
  describe("POST /api/tickets", () => {
    test("should create a new ticket with AI analysis", async () => {
      analyzeTicket.mockResolvedValue({
        category: "Technical Bug",
        priority: "high",
      });

      const response = await request(app)
        .post("/api/tickets")
        .send({
          name: "John Doe",
          email: "john@example.com",
          subject: "App crashes",
          description: "It crashes when I click save",
        });

      expect(response.status).toBe(201);
      expect(response.body.ticket).toHaveProperty("category", "Technical Bug");
      expect(response.body.ticket).toHaveProperty("priority", "high");
      expect(response.body.ticket.title).toBe("App crashes");

      const ticketInDb = await Ticket.findOne({ title: "App crashes" });
      expect(ticketInDb).toBeTruthy();
      expect(ticketInDb.category).toBe("Technical Bug");
    });

    test("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/tickets")
        .send({
          name: "John Doe",
          // email missing
          subject: "Help",
          description: "Missing email",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/all required/);
    });
  });

  describe("GET /api/tickets", () => {
    test("should return paginated tickets", async () => {
      // Create 15 tickets
      const tickets = [];
      for (let i = 0; i < 15; i++) {
        tickets.push({
          title: `Ticket ${i}`,
          description: "Desc",
          customer_email: "test@example.com",
          customer_name: "User",
          status: "open",
          priority: "medium",
        });
      }
      await Ticket.insertMany(tickets);

      const response = await request(app).get("/api/tickets?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(response.body.tickets).toHaveLength(10);
      expect(response.body.total).toBe(15);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe("GET /api/tickets/:id", () => {
    test("should return a single ticket", async () => {
      const ticket = await Ticket.create({
        title: "Single Ticket",
        description: "Desc",
        customer_email: "test@example.com",
        customer_name: "User",
      });

      const response = await request(app).get(`/api/tickets/${ticket._id}`);

      expect(response.status).toBe(200);
      expect(response.body.ticket.title).toBe("Single Ticket");
    });

    test("should return 404 for non-existent ticket", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/tickets/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/tickets", () => {
    test("should return 400 for invalid status", async () => {
      const response = await request(app).get("/api/tickets?status=invalid");
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Invalid status/);
    });

    test("should return 400 for invalid priority", async () => {
      const response = await request(app).get("/api/tickets?priority=invalid");
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Invalid priority/);
    });
  });

  describe("PATCH /api/tickets/:id", () => {
    test("should return 400 for invalid status", async () => {
      const ticket = await Ticket.create({
        title: "Test",
        description: "Desc",
        customer_email: "t@e.com",
        customer_name: "U",
      });
      const response = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .send({ status: "invalid" });
      expect(response.status).toBe(400);
    });

    test("should return 400 for invalid ID format", async () => {
      const response = await request(app)
        .patch("/api/tickets/not-an-id")
        .send({ status: "resolved" });
      expect(response.status).toBe(400);
    });
  });

  describe("Server Error Simulation", () => {
    test("should return 500 when Ticket.create fails", async () => {
      jest.spyOn(Ticket, "create").mockRejectedValue(new Error("Db Error"));
      const response = await request(app)
        .post("/api/tickets")
        .send({
          name: "John",
          email: "j@e.com",
          subject: "S",
          description: "D",
        });
      expect(response.status).toBe(500);
      Ticket.create.mockRestore();
    });
  });
});
