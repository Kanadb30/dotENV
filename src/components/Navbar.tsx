'use client';

/**
 * Navbar Component
 *
 * Displays user's full name (from Supabase metadata) with logo.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                // Prefer full_name from metadata, fallback to email prefix
                const name = user.user_metadata?.full_name
                    || user.email?.split('@')[0]
                    || 'User';
                setDisplayName(name);
            }
        });
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success('Signed out');
        router.push('/');
        router.refresh();
    };

    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 32px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-050)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                    <img src="/logo.svg" alt="dotENV" style={{ height: 32, borderRadius: 4 }} />
                </Link>
                <span style={{ color: 'var(--border-default)', fontSize: '1.2rem', fontWeight: 200 }}>/</span>
                <Link href="/dashboard" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color var(--transition-fast)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                    Projects
                </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {displayName && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-dim)',
                    }}>
                        <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{
                            fontSize: '0.8125rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {displayName}
                        </span>
                    </div>
                )}
                <button onClick={handleSignOut} className="btn-ghost" style={{ gap: 6 }}>
                    <LogOut size={14} /> Sign out
                </button>
            </div>
        </nav>
    );
}
