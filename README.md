# dotENV — Secure Secret Manager

A developer-focused secret manager for storing and retrieving `.env` secrets using **end-to-end encryption** (E2EE).

> Your master password never leaves your browser. All encryption/decryption happens client-side using **AES-256-GCM** with **PBKDF2** key derivation.

---

## Features

- **End-to-End Encryption** — AES-256-GCM + PBKDF2 (100k iterations)
- **Project-Based** — Organize secrets by project with per-project master passwords
- **Import .env** — Parse and bulk-import from `.env` files
- **Export .env** — Decrypt and download full `.env` file
- **Professional Dark UI** — Vercel/Supabase-inspired design
- **Smooth Animations** — Powered by anime.js
- **Zero-Knowledge** — Master password never stored or transmitted

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Animations | anime.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Encryption | Web Crypto API |
| Deployment | Vercel |

---

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

---

## Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon (Public) Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Enable Authentication

1. In Supabase dashboard, go to **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. *(Optional)* Disable email confirmation for faster dev testing under **Authentication → Settings**

### 3. Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run:

```sql
-- ═══════════════════════════════════════
-- dotENV Database Schema
-- ═══════════════════════════════════════

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mp_verify TEXT,
  mp_iv TEXT,
  mp_salt TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own projects
CREATE POLICY "Users can CRUD own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Secrets table
CREATE TABLE secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access secrets in their own projects
CREATE POLICY "Users can CRUD own secrets"
  ON secrets FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Encryption Architecture

```
Master Password (browser only, never stored/sent)
        │
        ▼
   ┌──────────┐
   │  PBKDF2  │  100,000 iterations, SHA-256, random 16-byte salt
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ AES-256  │  GCM mode, random 12-byte IV
   │  -GCM    │
   └────┬─────┘
        │
        ▼
  Encrypted Data    →  Stored in Supabase
  (ciphertext + IV + salt, all Base64)
```

- **PBKDF2** derives a 256-bit key from the master password + random salt
- **AES-GCM** encrypts the secret value using the derived key + random IV
- Only `ciphertext`, `iv`, and `salt` are stored — never the key or master password
- Each secret has its own unique salt and IV

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, toast, dark mode)
│   ├── page.tsx                # Landing page
│   ├── auth/
│   │   ├── login/page.tsx      # Login page
│   │   ├── signup/page.tsx     # Signup page
│   │   └── callback/route.ts   # Auth callback handler
│   ├── dashboard/page.tsx      # Project list
│   └── project/[id]/page.tsx   # Secrets management
├── components/
│   ├── Navbar.tsx
│   ├── CreateProjectModal.tsx
│   ├── MasterPasswordModal.tsx
│   ├── AddSecretModal.tsx
│   ├── UploadEnvModal.tsx
│   └── SecretRow.tsx
├── lib/
│   ├── crypto.ts               # E2EE (PBKDF2 + AES-GCM)
│   ├── env-parser.ts           # .env file parse/generate
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server client
│       └── middleware.ts       # Auth middleware
└── middleware.ts                # Route protection
```

---

## License

MIT
