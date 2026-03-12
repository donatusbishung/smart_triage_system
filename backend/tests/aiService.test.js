const { GoogleGenerativeAI } = require("@google/generative-ai");

jest.mock("@google/generative-ai");

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

GoogleGenerativeAI.mockImplementation(() => ({
  getGenerativeModel: mockGetGenerativeModel,
}));

// Require the service AFTER setting up the mock
const { analyzeTicket } = require("../services/aiService");

describe("aiService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should correctly analyze a ticket and return category and priority", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '{"category": "Technical Bug", "priority": "high"}',
      },
    });

    const result = await analyzeTicket("App crashing", "The app crashes on startup");

    expect(result).toEqual({
      category: "Technical Bug",
      priority: "high",
    });
  });

  test("should handle markdown code fences in AI response", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '```json\n{"category": "Billing", "priority": "medium"}\n```',
      },
    });

    const result = await analyzeTicket("Billing issue", "I was overcharged");

    expect(result).toEqual({
      category: "Billing",
      priority: "medium",
    });
  });

  test("should return defaults if AI returns invalid category/priority", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '{"category": "Invalid Category", "priority": "super-high"}',
      },
    });

    const result = await analyzeTicket("Random", "Random description");

    expect(result).toEqual({
      category: "General Inquiry",
      priority: "medium",
    });
  });

  test("should return defaults if AI response is not valid JSON", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "Not a JSON",
      },
    });

    const result = await analyzeTicket("Random", "Random description");

    expect(result).toEqual({
      category: "General Inquiry",
      priority: "medium",
    });
  });

  test("should return defaults if AI service fails", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API Error"));

    const result = await analyzeTicket("Random", "Random description");

    expect(result).toEqual({
      category: "General Inquiry",
      priority: "medium",
    });
  });
});
