# Mohamad's MediCore Pharmacy GmbH online

A modern online pharmacy platform built with **TanStack Start**, **React**, **Supabase**, and **Cloudflare Workers**. Patients can browse medications, upload prescriptions, place orders, and track fulfilment — all in one secure interface.

## Tech Stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Frontend   | React 19, TanStack Router, TanStack Query  |
| Styling    | Tailwind CSS 4, shadcn/ui components       |
| Backend    | TanStack Start (SSR), Cloudflare Workers   |
| Database   | Supabase (PostgreSQL + RLS + Storage)      |
| Auth       | Supabase Auth (email/password)             |
| State      | Zustand (cart), React Context (auth/theme) |
| Forms      | Zod                                        |
| Deployment | Cloudflare (via Wrangler)                  |

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      Browser (Client)                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐   │
│  │ React 19 │  │ TanStack │  │ Zustand (cart)         │   │
│  │  (JSX)   │  │  Router  │  │ Auth/Theme/Language    │   │
│  └────┬─────┘  └────┬─────┘  │ Contexts               │   │
│       └─────────────┴────────┴────────────────────────┘   │
│                     │                                     │
│             Client Services (src/lib/*.ts)                │
│            Thin wrappers calling server functions         │
└───────────────────────┬───────────────────────────────────┘
                        │
┌───────────────────────┴───────────────────────────────────┐
│            TanStack Start Server Functions                │
│               (src/server/api/*.ts)                       │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Auth API │  │Medication│  │ Order API│  │ Profile  │   │
│  │ signUp/  │  │  list/   │  │ create/  │  │ CRUD     │   │
│  │ signIn   │  │  detail  │  │ fetch    │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Contact  │  │  Admin   │  │  Auth    │                 │
│  │ Form     │  │ Orders/  │  │ Helpers  │                 │
│  │          │  │ Settings │  │(getUser) │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼  (service_role key on server)
┌───────────────────────┴───────────────────────────────────┐
│                   Supabase (Backend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  PostgreSQL  │  │     Auth     │  │    Storage       │ │
│  │  + RLS       │  │  (email/pw)  │  │  (prescriptions) │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

**Key architectural decision**: All external API calls to Supabase go through TanStack Start server functions (`src/server/api/`). The client never directly calls the Supabase SDK for data operations — it invokes server functions that use the service-role client (`supabaseAdmin`) or an anonymous client created server-side. This fulfils the IU assignment requirement that "external APIs are consumed by the backend only, not from the frontend."

### Design Decisions

| Decision          | Choice                                 | Rationale                                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SSR Framework** | TanStack Start                         | Server-side rendering for SEO (medication pages), faster initial load, and the ability to keep auth-token handshake secure. Built on Vite — same dev experience as the client.                                                                  |
| **API Layer**     | Server Functions                       | All Supabase calls are proxied through `createServerFn` handlers. The frontend calls typed server functions; the backend executes the actual Supabase queries using the service-role key. This ensures external APIs are consumed backend-only. |
| **Deployment**    | Cloudflare Workers                     | Edge-deployed SSR eliminates cold starts; Workers run close to the user. Free tier is generous for a student project.                                                                                                                           |
| **Database**      | Supabase (PostgreSQL)                  | Provides auth, storage, and a relational DB in one managed service. Server functions use the service-role key and bypass RLS, simplifying access control.                                                                                       |
| **Auth**          | Supabase Auth (PKCE)                   | Built-in email/password with PKCE flow. Auth server functions return the session to the client, which sets it via `supabase.auth.setSession()`.                                                                                                 |
| **State (cart)**  | Zustand + localStorage                 | Simpler than Redux; the `persist` middleware syncs to localStorage automatically so the cart survives page reloads without server round-trips.                                                                                                  |
| **Styling**       | Tailwind CSS 4 + shadcn/ui             | Utility-first CSS keeps the bundle small; shadcn provides accessible, unstyled primitives that we customised to the pharmacy brand.                                                                                                             |
| **Validation**    | Zod                                    | Schema-based validation on the client (profile form) with the same types that could be reused on the server if needed.                                                                                                                          |
| **Language**      | React Context + hardcoded translations | Lightweight bilingual support (DE/EN) without pulling in i18n libraries. Persists choice to localStorage and respects the browser's `accept-language` header on first visit.                                                                    |
| **File upload**   | Server Function + Supabase Storage     | Prescriptions are uploaded as base64 through a server function, which stores them in a private bucket with signed-url access.                                                                                                                   |
| **Testing**       | Vitest                                 | Native Vite integration — zero-config setup. Tests focus on pure business logic (cart, auth error categorisation) and hook behaviour.                                                                                                           |

```
src/
├── components/         # UI components (custom + shadcn/ui)
│   └── ui/             # shadcn primitives (button, card, dialog, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations (Supabase)
│   └── supabase/
│       ├── client.ts           # Client-side anon Supabase client
│       ├── client.server.ts    # Server-side service-role client (supabaseAdmin)
│       ├── auth-attacher.ts    # Client middleware: attaches Bearer token
│       └── types.ts           # Supabase Database type definitions
├── lib/                # Services, utilities, contexts
│   ├── auth-service.ts         # Auth operations (delegates to server functions)
│   ├── auth-types.ts           # Pure auth error types + categorization
│   ├── medication-service.ts   # Medication operations (delegates to server)
│   ├── order-service.ts        # Order operations (delegates to server)
│   ├── profile-service.ts      # Profile operations (delegates to server)
│   ├── contact-service.ts      # Contact form (delegates to server)
│   ├── cart.ts                 # Zustand cart store (client-only, no server)
│   ├── auth.tsx                # AuthProvider + useAuth hook
│   └── LanguageContext.tsx     # DE/EN i18n context
├── server/
│   └── api/             # TanStack Start server functions
│       ├── auth.ts             # signUp, signIn, password reset, email update
│       ├── admin.ts            # order management, settings toggle
│       ├── medications.ts      # list/detail medication queries
│       ├── orders.ts           # order CRUD, prescription upload
│       ├── profile.ts          # get/update user profile
│       ├── contact.ts          # submit contact form
│       └── auth-helpers.ts     # getAuthUserId, requireStaffRole utilities
├── routes/              # TanStack Router file-based routes
├── server.ts            # Cloudflare Workers entry (SSR error wrapper)
├── start.ts             # TanStack Start instance + function middleware
├── router.tsx           # Router configuration
└── styles.css           # Global styles + Tailwind theme
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or bun
- A Supabase project (free tier works)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Fill in your Supabase credentials in .env
#    Find these in your Supabase dashboard → Settings → API

# 4. Apply the database schema
#    Open your Supabase SQL Editor and run the migration file at:
#    supabase/migrations/20260606000000_complete_schema.sql

# 5. Start the dev server
npm run dev
```

### Environment Variables

| Variable                               | Required | Description                          |
| -------------------------------------- | -------- | ------------------------------------ |
| `SUPABASE_URL`                         | Yes      | Supabase project URL                 |
| `SUPABASE_PUBLISHABLE_KEY`             | Yes      | Supabase anon/public key             |
| `SUPABASE_SERVICE_ROLE_KEY`            | Yes      | Service role key (server-side ops)   |
| `VITE_SUPABASE_URL`                    | Yes      | Same as SUPABASE_URL (for Vite)      |
| `VITE_SUPABASE_PUBLISHABLE_KEY`        | Yes      | Same as anon key (for Vite)          |
| `VITE_SUPABASE_PROJECT_ID`             | Yes      | Supabase project ID                  |
| `NEXT_PUBLIC_SUPABASE_URL`             | No\*     | Fallback alias for VITE_SUPABASE_URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No\*     | Fallback alias for VITE anon key     |

> \* The `NEXT_PUBLIC_*` variables are fallback aliases supported by `client.ts`. You only need one set of URL/key variables per environment.

### Database Setup

The `supabase/migrations/` folder contains all the migrations. The complete schema is in `20260606000000_complete_schema.sql`. Apply it via the Supabase SQL Editor or the Supabase CLI:

```bash
supabase migration up
```

#### Database Password Note

The `SUPABASE_SERVICE_ROLE_KEY` is **not** the database password. To connect via `psql` or the Supabase CLI's `db push`, use the password from your Supabase project dashboard: **Project Settings → Database → Database password**. If you don't have the password, reset it there.

### Available Scripts

| Command              | Description                |
| -------------------- | -------------------------- |
| `npm run dev`        | Start development server     |
| `npm run build`      | Production build             |
| `npm run test`       | Run 49 unit tests (Vitest)   |
| `npm run test:watch` | Run tests in watch mode      |
| `npm run preview`    | Preview production build     |
| `npm run lint`       | Run ESLint                 |
| `npm run format`     | Format with Prettier       |
| `npx tsc --noEmit`   | TypeScript type check      |

## Deployment

The app deploys to Cloudflare Workers. Build and deploy with:

```bash
npm run build
npx wrangler deploy
```

Make sure your secrets are set:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## Database Schema

- **profiles** — User profiles (auto-created on signup via trigger)
- **user_roles** — Role assignments (patient, pharmacist, admin)
- **medications** — Product catalog with pricing and stock
- **orders** — Customer orders with status tracking
- **order_items** — Line items within each order
- **contact_messages** — Support form submissions
- **app_settings** — Key-value configuration store

Row-Level Security (RLS) is enabled on all tables. The server-side admin client uses the service-role key to bypass RLS for trusted operations.

## Demo Accounts

For quick evaluation, three pre-configured demo accounts are available:

| Role | Email | Password | Name |
|---|---|---|---|
| Admin | `admin@medicore.com` | `Admin123!` | Sarah Müller |
| Patient | `patient@medicore.com` | `Patient123!` | Anna Svensson |
| Pharmacist | `pharmacist@medicore.com` | `Pharmacist123!` | Erik Johansson |

Click the demo buttons on the login page to sign in instantly — no typing required.

## Features

- Browse medications with search and category filters
- Upload prescription documents (stored in private Supabase bucket)
- Shopping cart with persistent state (localStorage)
- Order placement with pickup or delivery options
- Real-time order status tracking
- Pharmacist dashboard for order management
- Admin settings panel (email confirmation toggle)
- German/English bilingual interface
- Dark/light theme support
- GDPR-compliant cookie consent banner
- **All Supabase operations proxied through backend server functions** — external APIs consumed server-side only

## Server Functions API

All data-access operations are exposed as typed server functions in `src/server/api/`. Each function runs on the server, authenticates the user via Bearer token (attached by client middleware), and queries Supabase using the service-role key.

| Server Function            | File             | Auth Required | Description                       |
| -------------------------- | ---------------- | ------------- | --------------------------------- |
| `fetchActiveMedications`   | `medications.ts` | No            | List active medications           |
| `fetchMedicationById`      | `medications.ts` | No            | Get medication by ID              |
| `fetchProfile`             | `profile.ts`     | Yes           | Get current user profile          |
| `updateProfile`            | `profile.ts`     | Yes           | Update user profile               |
| `fetchUserOrders`          | `orders.ts`      | Yes           | List current user's orders        |
| `fetchOrderById`           | `orders.ts`      | Yes           | Get order details with items      |
| `createOrder`              | `orders.ts`      | Yes           | Place a new order                 |
| `createOrderItems`         | `orders.ts`      | Yes           | Add items to an order             |
| `uploadPrescription`       | `orders.ts`      | Yes           | Upload prescription file          |
| `getPrescriptionSignedUrl` | `orders.ts`      | Yes           | Get signed URL for prescription   |
| `submitContactMessage`     | `contact.ts`     | No            | Submit contact form               |
| `signUp`                   | `auth.ts`        | No            | Create new user account           |
| `signIn`                   | `auth.ts`        | No            | Authenticate user                 |
| `signOut`                  | `auth.ts`        | Yes           | Sign out current user             |
| `resendVerification`       | `auth.ts`        | No            | Resend verification email         |
| `sendPasswordReset`        | `auth.ts`        | No            | Send password reset email         |
| `updateEmail`              | `auth.ts`        | Yes           | Update user email                 |
| `loadOrders`               | `admin.ts`       | Staff+        | Load all orders (staff view)      |
| `updateOrderStatus`        | `admin.ts`       | Staff+        | Update order status               |
| `getConfirmationSetting`   | `admin.ts`       | Yes           | Read email confirmation toggle    |
| `toggleConfirmation`       | `admin.ts`       | Staff+        | Toggle email confirmation setting |
