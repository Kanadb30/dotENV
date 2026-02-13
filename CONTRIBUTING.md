# Contributing to dotENV

Thank you for your interest in contributing to **dotENV**! This guide will help you set up your development environment and understand the project structure.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Encryption**: Web Crypto API (AES-256-GCM + PBKDF2)
- **Animations**: anime.js
- **Icons**: Lucide React

## Development Setup

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) account

### 2. Clone & Install

```bash
git clone https://github.com/your-username/dotenv.git
cd dotenv
npm install
```

### 3. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Run the following SQL in your Supabase SQL Editor to set up the schema and RLS policies:

```sql
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

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy
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

-- Enable RLS
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policy
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

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Encryption Architecture

Understanding the security model is crucial for contributing to the core logic.

- **Client-Side Only**: The master password never leaves the browser.
- **Key Derivation**: We use `PBKDF2` (100,000 iterations, SHA-256) to derive a symmetric key from the master password.
- **Encryption**: `AES-256-GCM` is used for encrypting secrets.
- **Storage**: Only the `ciphertext`, `iv` (initialization vector), and `salt` are stored in the database.

See `src/lib/crypto.ts` for the implementation.
