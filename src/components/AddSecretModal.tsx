'use client';

/**
 * Add / Edit Secret Modal
 *
 * The master password is supplied by the parent (project page) after unlock.
 * Encrypts the secret value client-side before saving.
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { encrypt } from '@/lib/crypto';
import toast from 'react-hot-toast';
import anime from 'animejs';
import { X } from 'lucide-react';

interface EditData {
    secretId: string;
    keyName: string;
    decryptedValue: string;
}

interface Props {
    projectId: string;
    masterPassword: string;
    editMode?: EditData;
    onClose: () => void;
    onSaved: () => void;
}

export default function AddSecretModal({ projectId, masterPassword, editMode, onClose, onSaved }: Props) {
    const [keyName, setKeyName] = useState(editMode?.keyName || '');
    const [value, setValue] = useState(editMode?.decryptedValue || '');
    const [loading, setLoading] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        anime({ targets: overlayRef.current, opacity: [0, 1], duration: 200, easing: 'easeOutCubic' });
        anime({ targets: contentRef.current, opacity: [0, 1], scale: [0.96, 1], duration: 250, easing: 'easeOutCubic' });
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const key = keyName.trim().toUpperCase();
        if (!key || !value) {
            toast.error('Both key name and value are required');
            return;
        }

        setLoading(true);

        try {
            const encrypted = await encrypt(value, masterPassword);
            const supabase = createClient();

            if (editMode) {
                const { error } = await supabase
                    .from('secrets')
                    .update({
                        key_name: key,
                        encrypted_value: encrypted.ciphertext,
                        iv: encrypted.iv,
                        salt: encrypted.salt,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editMode.secretId);

                if (error) throw error;
                toast.success('Secret updated');
            } else {
                const { error } = await supabase.from('secrets').insert({
                    project_id: projectId,
                    key_name: key,
                    encrypted_value: encrypted.ciphertext,
                    iv: encrypted.iv,
                    salt: encrypted.salt,
                });

                if (error) throw error;
                toast.success('Secret added');
            }

            onSaved();
        } catch {
            toast.error('Failed to save secret');
        }

        setLoading(false);
    };

    return (
        <div ref={overlayRef} className="modal-overlay" style={{ opacity: 0 }} onClick={(e) => e.target === overlayRef.current && onClose()}>
            <div ref={contentRef} className="modal-content" style={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>{editMode ? 'Edit secret' : 'Add secret'}</h2>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label className="label">Key name</label>
                        <input
                            type="text"
                            className="input-field input-mono"
                            placeholder="DATABASE_URL"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            autoFocus={!editMode}
                            disabled={!!editMode}
                            style={editMode ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label className="label">Value</label>
                        <textarea
                            className="input-field input-mono"
                            placeholder="postgres://user:pass@host:5432/db"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            rows={3}
                            style={{ resize: 'vertical', minHeight: 60 }}
                            autoFocus={!!editMode}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Encrypting…' : editMode ? 'Update' : 'Add secret'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
