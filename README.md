# Mini Ticket Tracker

A lightweight full-stack application for creating, viewing, and managing support tickets. Built as a take-home assignment using React, Node.js, Express, and PostgreSQL.

## Features

- Create tickets with a title, optional description, and priority.
- View tickets with their status, priority, and creation date.
- Filter tickets by status.
- Paginate ticket results using the API.
- Update ticket status or priority.
- View ticket counts grouped by status.
- Automated API integration tests.

## Tech Stack

- **Frontend:** React and Vite
- **Backend:** Node.js and Express
- **Database:** PostgreSQL
- **Testing:** Vitest and Supertest

## Prerequisites

Install Node.js (20 or newer), npm, and PostgreSQL.

## Setup and Run

### 1. Clone the repository

```bash
git clone https://github.com/danielwambo/mini-ticket-tracker.git
cd mini-ticket-tracker
```

### 2. Configure PostgreSQL

Create a PostgreSQL database and an application user with permission to create tables and read/write ticket data.

For example, using the PostgreSQL administrator account:

```sql
CREATE USER ticket_app WITH PASSWORD 'replace_with_a_secure_password';
CREATE DATABASE mini_ticket_tracker OWNER ticket_app;
```

Use the credentials you created when configuring the environment below.

### 3. Configure and start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set `DATABASE_URL` to your PostgreSQL connection string, for example:

```env
PORT=3000
DATABASE_URL=postgresql://ticket_app:replace_with_a_secure_password@localhost:5432/mini_ticket_tracker
```

Apply the database migration:

```bash
psql -h localhost -U ticket_app -d mini_ticket_tracker -W -f migrations/001_create_tickets.sql
```

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:3000`. Check its health at `http://localhost:3000/health`.

### 4. Configure and start the frontend

Open a second terminal:

```bash
cd mini-ticket-tracker/frontend
npm install
```

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### 5. Run the tests

Ensure PostgreSQL is running and `backend/.env` points to a development/test database. From the backend directory, run:

```bash
npm test
```

The integration tests exercise ticket creation, filtering/pagination, and grouped status statistics. They create and remove test tickets in the configured database.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/tickets` | Create a ticket |
| `GET` | `/tickets` | List tickets with pagination |
| `GET` | `/tickets?status=open` | Filter tickets by status |
| `GET` | `/tickets?page=1&limit=10` | Select a page of tickets |
| `PATCH` | `/tickets/:id` | Update ticket status or priority |
| `GET` | `/tickets/stats` | Count tickets grouped by status |
| `GET` | `/health` | Check API health |

Valid statuses are `open`, `in_progress`, and `closed`. Valid priorities are `low`, `medium`, and `high`.

## Decisions & Tradeoffs

I chose Express because it provides a small, straightforward foundation for a REST API without adding unnecessary framework complexity. PostgreSQL provides relational integrity and supports constraints that keep ticket statuses and priorities valid. I used parameterized SQL queries to reduce SQL injection risk and added database constraints for required fields and allowed enum values. The React interface focuses on the core workflows instead of introducing a larger component library or complex state-management solution. Pagination is implemented at the API level so the application can handle larger ticket lists without fetching every record at once. The integration tests use the configured development database for simplicity, but a dedicated isolated test database would be safer for a larger project. Authentication, authorization, automated deployment, and advanced filtering were left out because they were outside the requested scope. With more time, I would add stronger test isolation, centralized request validation, structured logging, and more comprehensive error handling.

## Scope

This project implements the core ticket-tracking workflows requested in the take-home assignment and keeps the architecture intentionally small and easy to run locally.
