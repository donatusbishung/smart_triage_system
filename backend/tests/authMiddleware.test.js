const authMiddleware = require("../middleware/auth");
const jwt = require("jsonwebtoken");

describe("authMiddleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = "test-secret";
  });

  test("should call next() if valid token is provided", () => {
    const token = jwt.sign({ id: "user123" }, "test-secret");
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toHaveProperty("id", "user123");
  });

  test("should return 401 if no authorization header", () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/No token provided/) });
  });

  test("should return 401 if token is invalid", () => {
    req.headers.authorization = "Bearer invalid-token";

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringMatching(/Invalid or expired token/) });
  });

  test("should return 401 if token is not Bearer", () => {
    req.headers.authorization = "Token something";

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
