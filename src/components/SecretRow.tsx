'use client';

/**
 * SecretRow Component
 *
 * Displays a secret key with masked/revealed value.
 * Master password is provided by the parent (project page handles unlocking).
 * No browser prompts — all via React state.
 */

import { useState, useRef, useCallback } from 'react';
import { decrypt } from '@/lib/crypto';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Copy, Pencil, Trash2 } from 'lucide-react';

interface Secret {
    id: string;
    key_name: string;
    encrypted_value: string;
    iv: string;
    salt: string;
    created_at: string;
}

interface Props {
    secret: Secret;
    masterPassword: string; // Provided by parent after unlock
    onEdit: (secretId: string, keyName: string, decryptedValue: string) => void;
    onDelete: (secretId: string) => void;
}

export default function SecretRow({ secret, masterPassword, onEdit, onDelete }: Props) {
    const [revealed, setRevealed] = useState(false);
    const [value, setValue] = useState('');
    const [decrypting, setDecrypting] = useState(false);
    const hideTimer = useRef<NodeJS.Timeout | null>(null);

    const decryptValue = useCallback(async (): Promise<string> => {
        const plain = await decrypt(secret.encrypted_value, secret.iv, secret.salt, masterPassword);
        return plain;
    }, [secret, masterPassword]);

    const handleReveal = async () => {
        if (revealed) {
            setRevealed(false);
            setValue('');
            if (hideTimer.current) clearTimeout(hideTimer.current);
            return;
        }

        setDecrypting(true);
        try {
            const plain = await decryptValue();
            setValue(plain);
            setRevealed(true);

            // Auto-hide after 15 seconds
            hideTimer.current = setTimeout(() => {
                setRevealed(false);
                setValue('');
            }, 15000);
        } catch {
            toast.error('Failed to decrypt');
        }
        setDecrypting(false);
    };

    const handleCopy = async () => {
        try {
            const plain = await decryptValue();
            await navigator.clipboard.writeText(plain);
            toast.success('Copied to clipboard');
        } catch {
            toast.error('Failed to decrypt');
        }
    };

    const handleEdit = async () => {
        try {
            const plain = await decryptValue();
            onEdit(secret.id, secret.key_name, plain);
        } catch {
            toast.error('Failed to decrypt');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: 'var(--bg-100)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            transition: 'border-color var(--transition-fast)',
        }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
            {/* Key name */}
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: '0 0 auto',
                maxWidth: '40%',
            }}>
                {secret.key_name}
            </span>

            {/* Value */}
            <span style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: revealed ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {revealed ? value : '••••••••••••••••'}
            </span>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button
                    onClick={handleReveal}
                    disabled={decrypting}
                    className="btn-icon"
                    title={revealed ? 'Hide value' : 'Reveal value'}
                    aria-label={revealed ? 'Hide value' : 'Reveal value'}
                >
                    {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={handleCopy} className="btn-icon" title="Copy value" aria-label="Copy value">
                    <Copy size={14} />
                </button>
                <button onClick={handleEdit} className="btn-icon" title="Edit secret" aria-label="Edit">
                    <Pencil size={14} />
                </button>
                <button
                    onClick={() => onDelete(secret.id)}
                    className="btn-icon"
                    title="Delete"
                    aria-label="Delete"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
