'use client';

/**
 * Master Password Modal
 *
 * Reusable "unlock" modal that prompts for the project master password.
 * Verifies against the project's stored verification data.
 * Professional UI with clear messaging.
 *
 * Supports lockout state: when locked out, the form is disabled and a
 * countdown timer is displayed showing time remaining.
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import anime from 'animejs';
import { X, Lock, AlertTriangle, ShieldOff, Clock } from 'lucide-react';

interface Props {
    title?: string;
    description?: string;
    onSubmit: (password: string) => void | Promise<void>;
    onClose: () => void;
    loading?: boolean;
    /** Number of attempts remaining before lockout (e.g. 2, 1, 0) */
    remainingAttempts?: number;
    /** Maximum allowed attempts (default 3) */
    maxAttempts?: number;
    /** Whether the project is currently locked out */
    lockedOut?: boolean;
    /** Formatted countdown string like "2h 45m 12s" */
    lockoutCountdown?: string;
}

export default function MasterPasswordModal({
    title = 'Enter master password',
    description = 'Enter the master password for this project to unlock your secrets.',
    onSubmit,
    onClose,
    loading = false,
    remainingAttempts,
    maxAttempts = 3,
    lockedOut = false,
    lockoutCountdown,
}: Props) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        anime({
            targets: overlayRef.current,
            opacity: [0, 1],
            duration: 200,
            easing: 'easeOutCubic',
        });
        anime({
            targets: contentRef.current,
            opacity: [0, 1],
            scale: [0.96, 1],
            duration: 250,
            easing: 'easeOutCubic',
        });
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!password || lockedOut) return;

        try {
            await onSubmit(password);
        } catch {
            setError('Incorrect master password');
        }
    };

    // Determine whether to show attempts warning (show after at least 1 failure)
    const showAttemptsWarning =
        !lockedOut &&
        remainingAttempts !== undefined &&
        remainingAttempts < maxAttempts &&
        remainingAttempts > 0;

    return (
        <div
            ref={overlayRef}
            className="modal-overlay"
            style={{ opacity: 0 }}
            onClick={(e) => e.target === overlayRef.current && onClose()}
        >
            <div ref={contentRef} className="modal-content" style={{ opacity: 0, maxWidth: 400 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            background: lockedOut ? 'rgba(239, 68, 68, 0.12)' : 'var(--accent-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: lockedOut ? 'var(--error)' : 'var(--text-secondary)',
                            transition: 'all 0.3s ease',
                        }}>
                            {lockedOut ? <ShieldOff size={18} /> : <Lock size={18} />}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1rem' }}>
                                {lockedOut ? 'Project locked' : title}
                            </h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                {lockedOut
                                    ? 'Too many failed attempts. Try again later.'
                                    : description}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>

                {/* Lockout banner */}
                {lockedOut && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        marginBottom: 16,
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 10px',
                            color: 'var(--error)',
                        }}>
                            <Clock size={20} />
                        </div>
                        <p style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: 'var(--error)',
                            marginBottom: 4,
                        }}>
                            Password entry locked
                        </p>
                        <p style={{
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                            letterSpacing: '0.5px',
                        }}>
                            {lockoutCountdown || '—'}
                        </p>
                        <p style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-tertiary)',
                            marginTop: 6,
                        }}>
                            3 consecutive incorrect attempts detected.
                            <br />
                            Please wait for the timer to expire.
                        </p>
                    </div>
                )}

                {/* Password form — hidden when locked out */}
                {!lockedOut && (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Master password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                autoFocus
                            />
                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--error)', fontSize: '0.75rem' }}>
                                    <AlertTriangle size={12} /> {error}
                                </div>
                            )}
                            {showAttemptsWarning && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginTop: 8,
                                    color: '#f59e0b',
                                    fontSize: '0.75rem',
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    padding: '6px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                }}>
                                    <AlertTriangle size={12} />
                                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before lockout
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={loading || !password}>
                                {loading ? 'Verifying…' : 'Unlock'}
                            </button>
                        </div>
                    </form>
                )}

                {/* When locked out, only show a close button */}
                {lockedOut && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}
