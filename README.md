# Smart Triage System

An AI-powered customer support ticket management system that automatically categorizes and triages support requests using machine learning, helping support teams prioritize and resolve issues more efficiently.

## Features

- **AI-Powered Triage**: Automatically categorizes tickets and assigns priorities using LLM APIs
- **Real-time Dashboard**: Modern, responsive UI for support agents to manage tickets
- **Smart Routing**: Categorizes tickets into: Billing, Technical Bug, Feature Request, Account Access, Hardware/Infrastructure, Network/Connectivity, General Inquiry
- **Priority Levels**: Automatic priority assignment (Low, Medium, High, Critical)
- **Role-Based Access Control**: Support agents, admins, and read-only users with different permissions
- **Authentication**: Secure JWT-based authentication
- **Graceful Degradation**: Falls back to rule-based triage if AI service is unavailable
- **Docker Support**: Full containerization for development and production

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB (handled by Docker)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd smart_triage_system
```

2. **Set up environment variables**

Create `.env` files:

**backend/.env**

```env
PORT=5000
MONGODB_URI=mongodb://mongo:27017/smart_triage
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

**frontend/.env.local**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. **Start the application with Docker**

```bash
docker-compose up --build
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

### Local Development (without Docker)

**Backend:**

```bash
cd backend
npm install
npm start
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Tickets

- `GET /api/tickets` - Get all tickets (paginated)
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `PATCH /api/tickets/:id/status` - Update ticket status
- `DELETE /api/tickets/:id` - Delete ticket (admin only)

### Health

- `GET /api/health/ai` - Check AI service status

## Authentication & Authorization

### Role-Based Access Control (RBAC)

**Support Agent**

- View and manage tickets
- Update ticket status and priority
- Cannot delete tickets or manage users

## Verification Tasks

### 1. RBAC Implementation Design

**Question:** How would you implement Role-Based Access Control (RBAC) if we added "Admins" and "Read-Only" users?

**Answer:**
We would extend the `User` model with a `role` field and include it in the JWT. An `authorize` middleware would then gate routes (e.g., `router.delete('/tickets/:id', authenticate, authorize(['admin']))`). The frontend would conditionally render elements like "Delete" buttons based on the decoded role from the `triage_session` cookie.

### 2. LLM API Failure Design

**Question:** What happens if the LLM API goes down? How is the API designed to handle this?

**Answer:**
The `analyzeTicket` service uses a `try...catch` block around the Gemini AI call. If the API fails, it immediately returns default triage values (`category: "General Inquiry"`, `priority: "medium"`). This ensures the `POST /api/tickets` endpoint never fails due to AI downtime, maintaining 100% system availability for ticket intake.

## AI Integration

The system uses gemini API for intelligent ticket triage:

1. **Categorization**: Automatically assigns ticket categories based on content
2. **Priority Assignment**: Determines priority level from description and context
3. **Fallback Logic**: If AI service is unavailable, uses rule-based heuristics
4. **Confidence Scoring**: Provides confidence metric for AI decisions

### Graceful Degradation

The system implements a **Circuit Breaker pattern** to handle LLM API failures:

- Monitors AI service health
- Automatically falls back to keyword-based triage if AI fails
- Circuit breaker state: CLOSED (healthy) → OPEN (failed) → HALF_OPEN (recovery)
- Tickets marked with `aiProcessed` flag and `confidence` score

## Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

**Test Coverage Target**: 80% on core business logic (ticket creation, AI parsing, authentication)

### Test Strategy

- Unit tests for AI parsing logic
- Integration tests for ticket creation flow
- E2E tests for critical user workflows (including when AI is unavailable)
