# Project Structure

This document outlines the file organization of the `dotENV` project.

## Directory Layout

```
env/
├── public/                 # Static assets
│   ├── favicon.svg         # Project favicon
│   └── logo.svg            # Project logo
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── auth/           # Authentication routes
│   │   │   ├── callback/   # OAuth/Magic Link callback
│   │   │   ├── login/      # Login page
│   │   │   └── signup/     # Signup page
│   │   ├── dashboard/      # Project dashboard
│   │   ├── project/[id]/   # Project details & secrets
│   │   ├── globals.css     # Global styles & themes
│   │   ├── layout.tsx      # Root layout (fonts, providers)
│   │   └── page.tsx        # Landing page
│   ├── components/         # Reusable UI components
│   │   ├── AddSecretModal.tsx      # Modal for adding/editing secrets
│   │   ├── CreateProjectModal.tsx  # Modal for new projects
│   │   ├── DeleteProjectModal.tsx  # Modal for dangerous deletions
│   │   ├── Footer.tsx              # Site footer
│   │   ├── MasterPasswordModal.tsx # Security checkpoint modal
│   │   ├── Navbar.tsx              # Main navigation
│   │   ├── SecretRow.tsx           # Individual secret item
│   │   └── UploadEnvModal.tsx      # Bulk upload modal
│   ├── lib/                # Core libraries & utilities
│   │   ├── supabase/       # Database clients
│   │   │   ├── client.ts   # Client-side Supabase
│   │   │   ├── middleware.ts # Edge middleware helpers
│   │   │   └── server.ts   # Server-side Supabase
│   │   ├── crypto.ts       # E2EE logic (AES-GCM + PBKDF2)
│   │   └── env-parser.ts   # dotenv file parser/generator
│   └── middleware.ts       # Route protection middleware
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT License
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies & scripts
├── postcss.config.mjs      # PostCSS configuration
├── README.md               # Project overview
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Modules

### `src/lib/crypto.ts`
Handles all client-side encryption. This is the core security module. It implements:
- `deriveKey`: PBKDF2 key derivation from master password.
- `encrypt`: AES-GCM encryption of individual secrets.
- `decrypt`: AES-GCM decryption for viewing/exporting.

### `src/lib/env-parser.ts`
Utility for handling `.env` file format.
- `parseEnvFile`: Converts raw string to key-value pairs.
- `generateEnvFile`: Converts key-value array to `.env` string for download.

### `src/components/*`
Contains all UI components. Modals are heavily used for interactions (creating projects, adding secrets, uploading files) to keep the main pages clean.

### `src/app/project/[id]/page.tsx`
The main workspace for managing secrets. It handles:
- Project locking/unlocking flow.
- Real-time secret CRUD operations.
- Optimistic UI updates.
