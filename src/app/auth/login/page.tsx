'use client';

/**
 * Login Page
 *
 * Email + password login using Supabase Auth.
 * anime.js fade-in animation on mount.
 */

import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div
                    className="dot-pattern"
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            border: '3px solid var(--border-primary)',
                            borderTopColor: 'var(--accent-blue)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
