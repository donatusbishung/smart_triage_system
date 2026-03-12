const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const authRoutes = require("../routes/authRoutes");
const User = require("../models/User");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = "test-secret";
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("Auth Routes", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  describe("POST /api/auth/register", () => {
    test("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(testUser.email);

      const userInDb = await User.findOne({ email: testUser.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.name).toBe(testUser.name);
    });

    test("should return 409 if email already exists", async () => {
      await User.create(testUser);

      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/already exists/);
    });

    test("should return 400 if fields are missing", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ name: "Only Name" });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    test("should login successfully with correct credentials", async () => {
      await request(app).post("/api/auth/register").send(testUser);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    test("should return 401 for incorrect password", async () => {
      await request(app).post("/api/auth/register").send(testUser);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
    });

    test("should return 401 for non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nobody@example.com",
          password: "password123",
        });

      expect(response.status).toBe(401);
    });

    test("should return 400 if credentials are missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(400);
    });
  });

  describe("Server Error Simulation", () => {
    test("should return 500 when User.findOne fails during login", async () => {
      jest.spyOn(User, "findOne").mockRejectedValue(new Error("Db Error"));
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(response.status).toBe(500);
      User.findOne.mockRestore();
    });

    test("should return 500 when User.create fails during registration", async () => {
      jest.spyOn(User, "create").mockRejectedValue(new Error("Db Error"));
      const response = await request(app)
        .post("/api/auth/register")
        .send({ name: "N", email: "e@e.com", password: "p" });

      expect(response.status).toBe(500);
      User.create.mockRestore();
    });
  });
});
