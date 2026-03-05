# BiteSpeed_Assessment
BiteSpeed Backend Task: Identity Reconciliation

This repository contains the backend service for the Identity Reconciliation task, built with Node.js, Express, TypeScript, and Prisma (SQLite).

## Tech Stack
- **Framework**: Express with TypeScript
- **Database**: SQLite
- **ORM**: Prisma (v5.10.2)
- **Deployment**: Ready to be deployed on platforms like Render.com

## How to run locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   npx prisma db push
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000`.

4. **Run the Test Script**
   An automated test script `test.js` is provided to verify all scenarios from the requirements. Run it in a separate terminal:
   ```bash
   node test.js
   ```

## Endpoint

### `POST /identify`

Accepts JSON payloads containing an `email`, `phoneNumber`, or both. Reconciles the customer's identity and returns a single primary contact along with any secondary contacts.

**Example Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Example Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

## Note on Deployment
For production deployment, ensure the `DATABASE_URL` environment variable is set appropriately in your hosting provider (e.g. Render.com). If using PostgreSQL or another DB, you can simply change the provider in `prisma/schema.prisma`.
