'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import anime from 'animejs';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const formRef = useRef<HTMLDivElement>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        anime({
            targets: formRef.current,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutCubic',
        });
    }, []);

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Name is required'); return; }
        if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name.trim(),
                },
            },
        });

        if (error) { toast.error(error.message); setLoading(false); return; }

        if (data.session) {
            toast.success('Account created');
            router.push('/dashboard');
        } else {
            toast.success('Check your email to confirm your account.', { duration: 8000 });
            router.push('/auth/login');
        }
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
                    <h1 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Create your account</h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 24 }}>Start managing your secrets securely</p>

                    <form onSubmit={handleSignup}>
                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="name" className="label">Full name</label>
                            <input id="name" type="text" className="input-field" placeholder="Kanad" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="email" className="label">Email</label>
                            <input id="email" type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="password" className="label">Password</label>
                            <input id="password" type="password" className="input-field" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label htmlFor="confirmPassword" className="label">Confirm password</label>
                            <input id="confirmPassword" type="password" className="input-field" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: 10 }}>
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        Already have an account?{' '}
                        <Link href="/auth/login" style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
