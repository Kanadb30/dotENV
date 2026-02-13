'use client';

/**
 * Delete Project Modal
 *
 * Multi-step confirmation modal for destructive project deletion.
 * Requires the user to type the project name AND "yes delete" to confirm.
 * GitHub-style dangerous action pattern.
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import anime from 'animejs';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
    projectName: string;
    onConfirm: () => void;
    onClose: () => void;
    loading?: boolean;
}

const CONFIRM_PHRASE = 'yes delete';

export default function DeleteProjectModal({ projectName, onConfirm, onClose, loading = false }: Props) {
    const [nameInput, setNameInput] = useState('');
    const [confirmInput, setConfirmInput] = useState('');
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const nameMatches = nameInput === projectName;
    const phraseMatches = confirmInput.toLowerCase() === CONFIRM_PHRASE;
    const canDelete = nameMatches && phraseMatches;

    useEffect(() => {
        anime({ targets: overlayRef.current, opacity: [0, 1], duration: 200, easing: 'easeOutCubic' });
        anime({ targets: contentRef.current, opacity: [0, 1], scale: [0.96, 1], duration: 250, easing: 'easeOutCubic' });
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (canDelete) onConfirm();
    };

    return (
        <div ref={overlayRef} className="modal-overlay" style={{ opacity: 0 }} onClick={(e) => e.target === overlayRef.current && onClose()}>
            <div ref={contentRef} className="modal-content" style={{ opacity: 0, maxWidth: 460 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                            background: 'var(--error-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--error)',
                        }}>
                            <Trash2 size={18} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--error)' }}>Delete project</h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>This action is permanent and irreversible</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>

                {/* Warning */}
                <div className="notice notice-error" style={{ marginBottom: 20 }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                        This will <strong>permanently delete</strong> the project <strong style={{ fontFamily: 'var(--font-mono)' }}>{projectName}</strong> and
                        all its encrypted secrets. This action <strong>cannot be undone</strong>.
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Type project name */}
                    <div style={{ marginBottom: 18 }}>
                        <label className="label">
                            Type <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{projectName}</span> to confirm
                        </label>
                        <input
                            type="text"
                            className="input-field input-mono"
                            placeholder={projectName}
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            autoFocus
                            style={{
                                borderColor: nameInput.length > 0
                                    ? nameMatches ? 'var(--success)' : 'var(--error)'
                                    : undefined,
                            }}
                        />
                        {nameInput.length > 0 && !nameMatches && (
                            <p style={{ fontSize: '0.6875rem', color: 'var(--error)', marginTop: 4 }}>
                                Project name does not match
                            </p>
                        )}
                    </div>

                    {/* Step 2: Type "yes delete" */}
                    <div style={{ marginBottom: 24 }}>
                        <label className="label">
                            Type <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>yes delete</span> to proceed
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="yes delete"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            disabled={!nameMatches}
                            style={{
                                opacity: nameMatches ? 1 : 0.4,
                                borderColor: confirmInput.length > 0
                                    ? phraseMatches ? 'var(--success)' : 'var(--error)'
                                    : undefined,
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="btn-danger"
                            disabled={!canDelete || loading}
                            style={{ opacity: canDelete ? 1 : 0.4 }}
                        >
                            {loading ? 'Deleting…' : 'Delete project permanently'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
