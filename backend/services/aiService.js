const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const VALID_CATEGORIES = [
  "Billing",
  "Technical Bug",
  "Feature Request",
  "Account Access",
  "Hardware/Infrastructure",
  "Network/Connectivity",
  "General Inquiry",
];

const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

/**
 * Analyzes a ticket description using Gemini AI and returns
 * an auto-assigned category and priority.
 *
 * @param {string} title - The ticket subject/title
 * @param {string} description - The full ticket description
 * @returns {Promise<{category: string, priority: string}>}
 */
async function analyzeTicket(title, description) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a support ticket triage assistant. Analyze the following support ticket and return a JSON object with exactly two fields:

1. "category" — one of: ${VALID_CATEGORIES.map((c) => `"${c}"`).join(", ")}
2. "priority" — one of: "low", "medium", "high", "critical"

Base priority on urgency and business impact:
- "critical": System down, data loss, security breach, blocking multiple users
- "high": Major feature broken, significant workflow disruption, urgent deadline
- "medium": Non-critical bug, moderate inconvenience, workaround exists
- "low": Minor cosmetic issue, general question, feature request

Ticket Subject: ${title}
Ticket Description: ${description}

Respond ONLY with a valid JSON object, no markdown, no explanation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse the JSON response, stripping any markdown code fences
    const cleanText = text.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleanText);

    // Validate the response
    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : "General Inquiry";

    const priority = VALID_PRIORITIES.includes(parsed.priority)
      ? parsed.priority
      : "medium";

    return { category, priority };
  } catch (error) {
    console.error("AI analysis failed, using defaults:", error.message);
    return {
      category: "General Inquiry",
      priority: "medium",
    };
  }
}

module.exports = { analyzeTicket };
