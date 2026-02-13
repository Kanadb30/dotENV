'use client';

/**
 * Landing Page
 *
 * Professional, minimal landing page inspired by Vercel/Supabase aesthetics.
 * Redirects authenticated users to dashboard.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import anime from 'animejs';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { Shield, FolderLock, Download, ArrowRight, Lock } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (loading) return;

    anime({
      targets: heroRef.current?.children,
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(100, { start: 80 }),
      duration: 600,
      easing: 'easeOutCubic',
    });

    anime({
      targets: featuresRef.current?.children,
      opacity: [0, 1],
      translateY: [24, 0],
      delay: anime.stagger(80, { start: 500 }),
      duration: 500,
      easing: 'easeOutCubic',
    });
  }, [loading]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-050)' }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--border-default)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-050)' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo.svg" alt="dotENV" style={{ height: 36, borderRadius: 4 }} />
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/auth/login" className="btn-ghost" style={{ padding: '6px 14px' }}>Log in</Link>
          <Link href="/auth/signup" className="btn-primary" style={{ padding: '6px 14px' }}>Sign up</Link>
        </div>
      </nav>

      {/* Hero */}
      <main ref={heroRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 32px 60px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--success-dim)', borderRadius: 999, fontSize: '0.75rem', color: 'var(--success)', fontFamily: 'var(--font-mono)', marginBottom: 24, fontWeight: 500, opacity: 0 }}>
          <Lock size={12} />
          End-to-end encrypted
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16, opacity: 0 }}>
          Secure secret management<br />for developers
        </h1>

        <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 440, marginBottom: 32, opacity: 0 }}>
          Store, manage, and share your environment variables with zero-knowledge encryption. Your master password never leaves your browser.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', opacity: 0 }}>
          <Link href="/auth/signup" className="btn-primary" style={{ padding: '10px 20px' }}>
            Get started <ArrowRight size={16} />
          </Link>
          <a href="#features" className="btn-secondary" style={{ padding: '10px 20px' }}>
            Learn more
          </a>
        </div>

        {/* Terminal preview */}
        <div style={{ marginTop: 56, width: '100%', maxWidth: 520, background: 'var(--bg-100)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', textAlign: 'left', opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg-400)' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg-400)' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg-400)' }} />
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>.env.local</span>
          </div>
          <pre style={{ padding: '16px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', lineHeight: 2, margin: 0, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}># Encrypted at rest</span>{'\n'}
            <span style={{ color: 'var(--text-primary)' }}>DATABASE_URL</span><span style={{ color: 'var(--text-tertiary)' }}>=</span><span style={{ color: 'var(--text-tertiary)' }}>••••••••••••••••••</span>{'\n'}
            <span style={{ color: 'var(--text-primary)' }}>API_SECRET</span><span style={{ color: 'var(--text-tertiary)' }}>=</span><span style={{ color: 'var(--text-tertiary)' }}>••••••••••••••••••</span>{'\n'}
            <span style={{ color: 'var(--text-primary)' }}>JWT_KEY</span><span style={{ color: 'var(--text-tertiary)' }}>=</span><span style={{ color: 'var(--text-tertiary)' }}>••••••••••••••••••</span>{'\n'}
            <span style={{ color: 'var(--text-primary)' }}>STRIPE_SK</span><span style={{ color: 'var(--text-tertiary)' }}>=</span><span style={{ color: 'var(--text-tertiary)' }}>••••••••••••••••••</span>
          </pre>
        </div>
      </main>

      {/* Features */}
      <section id="features" ref={featuresRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, maxWidth: 1100, margin: '40px auto 80px', padding: '0 32px' }}>
        {[
          { icon: <Shield size={20} />, title: 'Zero-knowledge E2EE', desc: 'AES-256-GCM with PBKDF2 key derivation. Your master password never leaves your browser.' },
          { icon: <FolderLock size={20} />, title: 'Project-based', desc: 'Organize secrets by project. Each project has its own master password for isolation.' },
          { icon: <Download size={20} />, title: 'Import & export', desc: 'Upload existing .env files or download decrypted secrets as a ready-to-use .env file.' },
        ].map((f, i) => (
          <div key={i} className="card" style={{ opacity: 0, borderRadius: 0, border: 'none', borderTop: '1px solid var(--border-default)', paddingTop: 24, background: 'transparent' }}>
            <div style={{ color: 'var(--text-tertiary)', marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 6 }}>{f.title}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
