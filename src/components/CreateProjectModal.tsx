'use client';

/**
 * Create Project Modal
 *
 * Collects project name AND master password at creation time.
 * Encrypts a verification string with the master password and stores it with the project.
 * Explains what the master password is and the consequences of losing it.
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { encrypt } from '@/lib/crypto';
import toast from 'react-hot-toast';
import anime from 'animejs';
import { X, AlertTriangle } from 'lucide-react';

// This string is encrypted with the master password and stored.
// It's used to verify the password later without ever storing the real password.
const VERIFICATION_STRING = '__dotenv_verify__';

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateProjectModal({ onClose, onCreated }: Props) {
    const [name, setName] = useState('');
    const [masterPassword, setMasterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
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

        if (!name.trim()) {
            toast.error('Project name is required');
            return;
        }

        if (masterPassword.length < 8) {
            toast.error('Master password must be at least 8 characters');
            return;
        }

        if (masterPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Encrypt the verification string with the master password
            const verification = await encrypt(VERIFICATION_STRING, masterPassword);

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Not authenticated');
                setLoading(false);
                return;
            }

            const { error } = await supabase.from('projects').insert({
                name: name.trim(),
                user_id: user.id,
                mp_verify: verification.ciphertext,
                mp_iv: verification.iv,
                mp_salt: verification.salt,
            });

            if (error) {
                toast.error(error.message);
                setLoading(false);
                return;
            }

            toast.success('Project created');
            onCreated();
        } catch {
            toast.error('Failed to create project');
            setLoading(false);
        }
    };

    return (
        <div ref={overlayRef} className="modal-overlay" style={{ opacity: 0 }} onClick={(e) => e.target === overlayRef.current && onClose()}>
            <div ref={contentRef} className="modal-content" style={{ opacity: 0, maxWidth: 480 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>Create project</h2>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Project Name */}
                    <div style={{ marginBottom: 18 }}>
                        <label className="label">Project name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="my-api-keys"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <hr className="divider" style={{ margin: '20px 0' }} />

                    {/* Master Password Education */}
                    <div className="notice notice-warning" style={{ marginBottom: 20 }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <strong style={{ fontSize: '0.8125rem' }}>Master password</strong>
                            <p style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                This password encrypts all secrets in this project using AES-256-GCM.
                                It is <strong style={{ color: 'var(--warning)' }}>never stored</strong> on our servers — only you know it.
                                If you lose this password, <strong style={{ color: 'var(--error)' }}>your secrets cannot be recovered</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Master Password */}
                    <div style={{ marginBottom: 18 }}>
                        <label className="label">Master password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Min 8 characters"
                            value={masterPassword}
                            onChange={(e) => setMasterPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <div style={{ marginBottom: 24 }}>
                        <label className="label">Confirm master password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Repeat master password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creating…' : 'Create project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
