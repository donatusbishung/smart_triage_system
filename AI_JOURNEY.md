# AI Journey - Smart Triage System Development

This document details the collaboration with AI coding assistants (Gemini, Claude) throughout the Smart Triage System development process.

## 1. Complex Prompts Used

### Prompt 1: Reusable Fetch Service Architecture

**Task:** Design and implement a production-ready fetch service layer for a Next.js frontend that can be reused across components.

**Prompt Given:**

```text
Create a reusable fetch service in TypeScript for a Next.js frontend (src/lib/fetchService.ts) that:
- Handles all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Manages authentication tokens via document.cookie ('triage_session')
- Includes robust error handling (ApiError class) with try/catch for JSON parsing
- Uses environment-based API URLs (NEXT_PUBLIC_API_URL)
- Exports convenience helpers like apiGet, apiPost
```

---

### Prompt 2: Ticket Data Model with AI Metadata

**Task:** Design a Mongoose schema for a ticket system that includes AI triage fields.

**Prompt Given:**

```text
Design a MongoDB/Mongoose ticket model (backend/models/Ticket.js) for an AI-powered triage system:
- Fields for title, description, customer_email, and customer_name
- Enum for priority: low, medium, high, critical
- Enum for status: open, in_progress, resolved, closed
- Field for 'category' with a default of 'General Inquiry'
- Timestamps and an index on status/priority for dashboard performance
- A virtual property 'ticketId' to generate a short ID (e.g., TRG-XXXX)
```

---

### Prompt 3: Gemini AI Integration Service

**Task:** Implement a service that uses Google's Generative AI (Gemini) to categorize and prioritize tickets.

**Prompt Given:**

```text
Create a backend service (backend/services/aiService.js) using @google/generative-ai that:
- Takes a ticket subject and description
- Prompts Gemini-pro to return a JSON object with 'category' and 'priority'
- Validates the AI response against a fixed list of allowed categories
- Implements a try/catch fallback that returns 'General Inquiry' / 'medium' if the LLM fails
- Strips markdown code fences from the AI response before parsing
```

## 2. AI Issues Caught and Fixed

### Issue: Incomplete Error Handling in fetchService

**What Happened:**
The initial AI-generated `fetchService` didn't account for cases where the server might return a non-JSON error or if the network request failed entirely.

**The Bug:**
The original code would attempt `await response.json()` without a safety net, potentially crashing the component if the response was an HTML error page (e.g., 504 Gateway Timeout).

**The Fix:**
I manually added a `try...catch` around the JSON parsing in both the error handler and the success path in `fetchService.ts` to ensure consistent `ApiError` objects are thrown even if the response is malformed.

```typescript
// Fixed logic in src/lib/fetchService.ts
try {
  const responseData = await response.json();
  return responseData;
} catch {
  throw new ApiError(response.status, "Failed to parse response JSON", null);
}
```
