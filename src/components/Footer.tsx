'use client';

/**
 * Footer Component
 *
 * Informative footer with branding and developer credit.
 */

import { Shield, Github } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--border-default)',
            padding: '32px 32px',
            marginTop: 'auto',
        }}>
            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
            }}>
                {/* Top row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 20,
                }}>
                    {/* Brand */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                        }}>
                            <img src="/logo.svg" alt="dotENV" style={{ height: 28, borderRadius: 4 }} />
                        </div>
                        <p style={{
                            fontSize: '0.8125rem',
                            color: 'var(--text-secondary)',
                            maxWidth: 280,
                            lineHeight: 1.5,
                        }}>
                            Secure secret management for developers. Zero-knowledge encryption ensures your secrets stay yours.
                        </p>
                    </div>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: 40 }}>
                        <div>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Security</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    <Shield size={12} /> AES-256-GCM
                                </li>
                                <li style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    PBKDF2 key derivation
                                </li>
                                <li style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    Client-side encryption
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <hr className="divider" />

                {/* Bottom row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                }}>
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        © {new Date().getFullYear()} dotENV · Designed & developed by <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Kanad</span>
                    </p>
                    <p style={{
                        fontSize: '0.6875rem',
                        color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono)',
                        fontStyle: 'italic',
                    }}>
                        &quot;Your secrets, your password, your control.&quot;
                    </p>
                </div>
            </div>
        </footer>
    );
}
