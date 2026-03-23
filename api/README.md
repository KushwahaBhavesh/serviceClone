# HomeService Platform API

An on-demand home service marketplace backend built with **Express**, **TypeScript**, and **Prisma**.

## 🚀 Technical Stack

- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Authentication**: JWT & Bcrypt (Email, Phone/OTP, Google Social)
- **Realtime**: Socket.io
- **Logging**: Winston & Morgan
- **Testing**: Vitest & Supertest

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` with your database URL and secrets.*

4. Setup database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

### Development

```bash
# Start development server
npm run dev

# Prisma Studio
npm run prisma:studio
```

### Testing

```bash
# Run test suite
npm test
```

## 🏗️ Architecture

- `src/controllers`: Request handlers
- `src/services`: Business logic & Database interaction
- `src/routes`: API route definitions
- `src/middleware`: Custom middleware (auth, error handling, etc.)
- `src/validators`: Zod schemas for input validation
- `src/utils`: Helper functions

## 📄 Documentation

The API follows a RESTful design. Major modules:
- **Auth**: Enrollment, login, and profile management.
- **Catalog**: Service categories and service definitions.
- **Booking**: Lifecycle of a service request.
- **Merchant**: Provider onboarding and dashboard data.
- **Agent**: Field professional job management.

## ⚖️ License

MIT
