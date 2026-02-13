'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import anime from 'animejs';
import Link from 'next/link';

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const formRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const error = searchParams.get('error');
        if (error) toast.error(error);

        anime({
            targets: formRef.current,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutCubic',
        });
    }, [searchParams]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        toast.success('Welcome back');
        router.push('/dashboard');
        router.refresh();
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-050)' }}>
            <div ref={formRef} style={{ opacity: 0, width: '100%', maxWidth: 380 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                        <img src="/logo.svg" alt="dotENV" style={{ height: 36, borderRadius: 6 }} />
                    </Link>
                </div>

                <div className="card" style={{ padding: 28 }}>
                    <h1 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Welcome back</h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 24 }}>Log in to access your secrets</p>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="email" className="label">Email</label>
                            <input id="email" type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label htmlFor="password" className="label">Password</label>
                            <input id="password" type="password" className="input-field" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: 10 }}>
                            {loading ? 'Logging in…' : 'Log in'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/signup" style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
