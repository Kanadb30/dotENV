'use client';

/**
 * Upload .env Modal
 *
 * Parse and bulk-import secrets from a .env file.
 * Master password is provided by the parent.
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { encrypt } from '@/lib/crypto';
import { parseEnvFile } from '@/lib/env-parser';
import toast from 'react-hot-toast';
import anime from 'animejs';
import { X, Upload, AlertTriangle, Check } from 'lucide-react';

interface Props {
    projectId: string;
    masterPassword: string;
    existingKeys: string[];
    onClose: () => void;
    onImported: () => void;
}

export default function UploadEnvModal({ projectId, masterPassword, existingKeys, onClose, onImported }: Props) {
    const [fileContent, setFileContent] = useState('');
    const [entries, setEntries] = useState<{ key: string; value: string; duplicate: boolean }[]>([]);
    const [loading, setLoading] = useState(false);
    const [imported, setImported] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        anime({ targets: overlayRef.current, opacity: [0, 1], duration: 200, easing: 'easeOutCubic' });
        anime({ targets: contentRef.current, opacity: [0, 1], scale: [0.96, 1], duration: 250, easing: 'easeOutCubic' });
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setFileContent(text);

            const parsed = parseEnvFile(text);
            setEntries(
                parsed.map((p) => ({
                    key: p.key,
                    value: p.value,
                    duplicate: existingKeys.includes(p.key),
                }))
            );
        };
        reader.readAsText(file);
    };

    const handleImport = async (e: FormEvent) => {
        e.preventDefault();

        const toImport = entries.filter((e) => !e.duplicate);
        if (toImport.length === 0) {
            toast.error('No new secrets to import');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            const records = await Promise.all(
                toImport.map(async (entry) => {
                    const encrypted = await encrypt(entry.value, masterPassword);
                    return {
                        project_id: projectId,
                        key_name: entry.key,
                        encrypted_value: encrypted.ciphertext,
                        iv: encrypted.iv,
                        salt: encrypted.salt,
                    };
                })
            );

            const { error } = await supabase.from('secrets').insert(records);
            if (error) throw error;

            setImported(true);
            toast.success(`${records.length} secret${records.length > 1 ? 's' : ''} imported`);

            setTimeout(() => onImported(), 800);
        } catch {
            toast.error('Failed to import secrets');
        }

        setLoading(false);
    };

    const duplicateCount = entries.filter((e) => e.duplicate).length;
    const newCount = entries.filter((e) => !e.duplicate).length;

    return (
        <div ref={overlayRef} className="modal-overlay" style={{ opacity: 0 }} onClick={(e) => e.target === overlayRef.current && onClose()}>
            <div ref={contentRef} className="modal-content" style={{ opacity: 0, maxWidth: 520 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ margin: 0 }}>Import .env file</h2>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>

                {imported ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--success)' }}>
                            <Check size={20} />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Secrets imported successfully</p>
                    </div>
                ) : (
                    <form onSubmit={handleImport}>
                        {/* File upload */}
                        {entries.length === 0 ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '1px dashed var(--border-default)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'border-color var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                            >
                                <Upload size={20} style={{ margin: '0 auto 8px', color: 'var(--text-tertiary)' }} />
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                                    Click to select a .env file
                                </p>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                                    .env, .env.local, .env.production
                                </p>
                                <input ref={fileInputRef} type="file" accept=".env,.env.local,.env.production,.env.development,.txt" onChange={handleFile} style={{ display: 'none' }} />
                            </div>
                        ) : (
                            <>
                                {/* Preview */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                        <span className="badge badge-neutral">{entries.length} found</span>
                                        {newCount > 0 && <span className="badge badge-success">{newCount} new</span>}
                                        {duplicateCount > 0 && <span className="badge badge-warning">{duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''}</span>}
                                    </div>

                                    <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                                        {entries.map((entry, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                                borderBottom: i < entries.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                                opacity: entry.duplicate ? 0.4 : 1,
                                            }}>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{entry.key}</span>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>= {entry.value.substring(0, 30)}{entry.value.length > 30 ? '…' : ''}</span>
                                                {entry.duplicate && <span style={{ marginLeft: 'auto', fontSize: '0.625rem', color: 'var(--warning)' }}>exists</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {duplicateCount > 0 && (
                                    <div className="notice notice-warning" style={{ marginBottom: 16 }}>
                                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span style={{ fontSize: '0.75rem' }}>{duplicateCount} duplicate key{duplicateCount > 1 ? 's' : ''} will be skipped.</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-secondary" onClick={() => { setEntries([]); setFileContent(''); }}>Re-upload</button>
                                    <button type="submit" className="btn-primary" disabled={loading || newCount === 0}>
                                        {loading ? 'Encrypting…' : `Import ${newCount} secret${newCount !== 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
