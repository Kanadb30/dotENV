'use client';

/**
 * Master Password Modal
 *
 * Reusable "unlock" modal that prompts for the project master password.
 * Verifies against the project's stored verification data.
 * Professional UI with clear messaging.
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import anime from 'animejs';
import { X, Lock, AlertTriangle } from 'lucide-react';

interface Props {
    title?: string;
    description?: string;
    onSubmit: (password: string) => void | Promise<void>;
    onClose: () => void;
    loading?: boolean;
}

export default function MasterPasswordModal({
    title = 'Enter master password',
    description = 'Enter the master password for this project to unlock your secrets.',
    onSubmit,
    onClose,
    loading = false,
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
        if (!password) {
            setError('Password is required');
            return;
        }

        try {
            await onSubmit(password);
        } catch {
            setError('Incorrect master password');
        }
    };

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
                        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                            <Lock size={18} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1rem' }}>{title}</h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                {description}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>

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
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading || !password}>
                            {loading ? 'Verifying…' : 'Unlock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
