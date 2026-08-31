# MindX Lab

An e-commerce product catalog with an admin panel for managing products, categories, and image uploads.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS (built with Vite)
- **Backend:** Vercel Serverless Functions (Node.js 20)
- **Database:** Neon PostgreSQL (serverless driver)
- **Auth:** JWT (HS256)
- **Image Storage:** Cloudinary
- **Deployment:** Vercel

## Project Structure

```
frontend/       → React SPA (Vite)
backend/
  api/          → Serverless API routes
  scripts/      → CLI scripts (migrate, seed)
  shared/       → Shared types and declarations
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A [Neon](https://neon.tech/) PostgreSQL account (free tier works)
- A [Cloudinary](https://cloudinary.com/) account (free tier works)

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd mindx-lab
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values. See `.env.example` for descriptions of each variable.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Random string (32+ chars) for signing tokens |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset name |
| `CLOUDINARY_UPLOAD_FOLDER` | Folder for uploaded images (default: `mindx-lab`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for hosting project bundles (web `.zip` / Scratch `.sb3`) |
| `ADMIN_USERNAME` | Username for the seeded admin account |
| `ADMIN_PASSWORD` | Password for the seeded admin account |

### 3. Run database migrations

```bash
npm run db:migrate
```

This creates all required tables in your Neon database.

### 4. Seed the admin user

```bash
npm run db:seed-admin
```

Creates an admin account using the `ADMIN_USERNAME` and `ADMIN_PASSWORD` from your `.env`.

### 5. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests with Vitest |
| `npm run db:migrate` | Create the `users`, `products` and `rate_limit_hits` tables |
| `npm run db:migrate-rbac` | One-time migration for older deployments (moves data from a legacy `admins` table into `users`) |
| `npm run db:seed-admin` | Seed the admin user (into the `users` table) |
| `npm run db:seed-users` | Seed sample users for each role (admin, teacher, sale) |

## API Routes

### Public

- `GET /api/products` — List products (with pagination and category filter)
- `GET /api/products/:id` — Get product details

### Authentication

- `POST /api/auth/login` — Authenticate and receive a JWT (returns the user's role). Rate limited: after 8 failed attempts for the same IP + username within 15 minutes it returns `429`.

### Admin (requires JWT)

Product management requires the `teacher` or `admin` role; user management requires `admin`.

- `GET /api/admin/stats` — Dashboard statistics
- `GET /api/admin/products` — List all products (admin view)
- `POST /api/admin/products` — Create a product
- `PUT /api/admin/products/:id` — Update a product
- `DELETE /api/admin/products/:id` — Delete a product
- `PATCH /api/admin/products/:id/publish` — Toggle publish status
- `POST /api/admin/upload` — Get a Cloudinary config to upload a thumbnail image
- `POST /api/admin/blob-upload` — Issues short-lived client tokens for direct-to-Blob uploads. The browser extracts a project bundle and uploads each file straight to Vercel Blob (bypassing the serverless body limit); this endpoint authorizes the request (teacher/admin) and scopes the token to the `projects/` prefix
- `GET /api/admin/users` — List users
- `POST /api/admin/users` — Create a user
- `PUT /api/admin/users/:id` — Update a user's role
- `DELETE /api/admin/users/:id` — Delete a user

## Project content types

Each product has an `embedType` that tells the frontend how to render it. End users
run everything inside a sandboxed iframe served from a separate origin (Vercel Blob).

| `embedType` | What the teacher uploads | How it plays |
|-------------|--------------------------|--------------|
| `link` | A URL typed into the form | Iframed directly (legacy behaviour) |
| `web` | A `.zip` of a static site containing `index.html` | Extracted in the browser, hosted on Vercel Blob, entry `index.html` iframed |
| `gamemaker` | A `.zip` of a **GameMaker HTML5 build** (contains `index.html`) | Same static-bundle hosting as `web` |
| `scratch` | A `.sb3` file | Hosted on Vercel Blob and played via an embedded Scratch player |

Uploads go straight from the browser to Vercel Blob (the zip is extracted
client-side), so large builds are not limited by the serverless request body size.

Note: a GameMaker `.yyz` file is a project export, not a runnable game. To let end
users play it, **build** the project to HTML5 in GameMaker and upload that build as a
`gamemaker` bundle. Pygame projects should first be packaged with
[`pygbag`](https://github.com/pygame-web/pygbag) and uploaded as a `web` bundle.

## Deployment

This project is configured for [Vercel](https://vercel.com/).

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Import the project in the Vercel dashboard.
3. Add all environment variables from `.env.example` in the Vercel project settings (Settings → Environment Variables).
4. Deploy. Vercel will automatically detect the configuration from `vercel.json`.

The `vercel.json` handles:
- Building the frontend from `frontend/vite.config.ts`
- Routing `/api/*` requests to serverless functions in `backend/api/`
- SPA fallback for all other routes
