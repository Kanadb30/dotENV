# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of this project seriously. If you discover a security vulnerability, please do NOT open an issue.

**Please email `kanadb@iitbhilai.ac.in` with the subject "Security Vulnerability".**

We will acknowledge your email within 48 hours.

## Security Architecture

This project uses **End-to-End Encryption (E2EE)** to protect user secrets.

- **Master Password**: Never leaves the client. Use a strong master password.
- **Encryption**: AES-256-GCM.
- **Key Derivation**: PBKDF2 (100,000 iterations).

If you find a flaw in the cryptographic implementation (`src/lib/crypto.ts`), please report it immediately.
