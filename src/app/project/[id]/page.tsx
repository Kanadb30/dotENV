'use client';

/**
 * Project Page — Secrets Management
 *
 * Master password flow:
 * 1. Page loads project data
 * 2. Shows "Unlock" screen with MasterPasswordModal
 * 3. Verifies password by decrypting the stored verification string
 * 4. Once unlocked, master password is kept in React state for the session
 * 5. All operations (reveal, copy, edit, add, upload, download) use the session password
 *
 * Lockout flow:
 * - Failed attempts are tracked via localStorage (see lib/lockout.ts)
 * - After 3 consecutive failures the unlock UI is disabled for 3 hours
 * - A live countdown timer shows the remaining lockout duration
 * - Successful unlock clears the lockout state
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { decrypt } from '@/lib/crypto';
import { generateEnvFile } from '@/lib/env-parser';
import {
    isLockedOut,
    recordFailedAttempt,
    getRemainingAttempts,
    clearLockout,
    MAX_ATTEMPTS,
} from '@/lib/lockout';
import Navbar from '@/components/Navbar';
import SecretRow from '@/components/SecretRow';
import AddSecretModal from '@/components/AddSecretModal';
import UploadEnvModal from '@/components/UploadEnvModal';
import MasterPasswordModal from '@/components/MasterPasswordModal';
import toast from 'react-hot-toast';
import anime from 'animejs';
import Footer from '@/components/Footer';
import { Plus, Upload, Download, ArrowLeft, Pencil, Lock, Key } from 'lucide-react';

const VERIFICATION_STRING = '__dotenv_verify__';

interface Secret {
    id: string;
    key_name: string;
    encrypted_value: string;
    iv: string;
    salt: string;
    created_at: string;
}

interface Project {
    id: string;
    name: string;
    created_at: string;
    mp_verify: string;
    mp_iv: string;
    mp_salt: string;
}

/** Format milliseconds as "Xh Ym Zs" */
function formatCountdown(ms: number): string {
    if (ms <= 0) return '0s';
    const totalSeconds = Math.ceil(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
}

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [loading, setLoading] = useState(true);

    // Master password session state
    const [masterPassword, setMasterPassword] = useState<string | null>(null);
    const [unlocking, setUnlocking] = useState(false);

    // Lockout state
    const [locked, setLocked] = useState(false);
    const [lockRemainingMs, setLockRemainingMs] = useState(0);
    const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
    const [editTarget, setEditTarget] = useState<{
        secretId: string;
        keyName: string;
        decryptedValue: string;
    } | null>(null);

    // Inline name editing
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState('');

    const headerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // ----- Lockout helpers -----

    /** Refresh lockout state from localStorage */
    const refreshLockoutState = useCallback(() => {
        const lockout = isLockedOut(projectId);
        setLocked(lockout.locked);
        setLockRemainingMs(lockout.remainingMs);

        if (!lockout.locked) {
            setAttemptsLeft(getRemainingAttempts(projectId));
        } else {
            setAttemptsLeft(0);
        }
    }, [projectId]);

    // Check lockout on mount
    useEffect(() => {
        refreshLockoutState();
    }, [refreshLockoutState]);

    // Live countdown timer while locked
    useEffect(() => {
        if (!locked) return;

        const interval = setInterval(() => {
            const lockout = isLockedOut(projectId);
            if (!lockout.locked) {
                // Lockout expired
                setLocked(false);
                setLockRemainingMs(0);
                setAttemptsLeft(getRemainingAttempts(projectId));
                clearInterval(interval);
                toast.success('Lockout expired. You can try again.');
            } else {
                setLockRemainingMs(lockout.remainingMs);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [locked, projectId]);

    const fetchData = useCallback(async () => {
        const supabase = createClient();

        const { data: projData, error: projError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projError || !projData) {
            toast.error('Project not found');
            router.push('/dashboard');
            return;
        }

        setProject(projData);
        setNewName(projData.name);

        const { data: secretsData, error: secretsError } = await supabase
            .from('secrets')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (secretsError) {
            toast.error('Failed to load secrets');
        }

        setSecrets(secretsData || []);
        setLoading(false);
    }, [projectId, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!loading && masterPassword) {
            anime({
                targets: headerRef.current,
                opacity: [0, 1],
                translateY: [16, 0],
                duration: 400,
                easing: 'easeOutCubic',
            });

            anime({
                targets: listRef.current?.children,
                opacity: [0, 1],
                translateY: [12, 0],
                delay: anime.stagger(40, { start: 150 }),
                duration: 350,
                easing: 'easeOutCubic',
            });
        }
    }, [loading, secrets, masterPassword]);

    // ----- Unlock -----

    const handleUnlock = async (password: string) => {
        setUnlocking(true);

        if (!project?.mp_verify) {
            // Legacy project without master password verification — just accept
            clearLockout(projectId);
            setMasterPassword(password);
            setUnlocking(false);
            return;
        }

        try {
            const result = await decrypt(project.mp_verify, project.mp_iv, project.mp_salt, password);
            if (result !== VERIFICATION_STRING) {
                throw new Error('Invalid');
            }
            // Success — clear lockout and unlock
            clearLockout(projectId);
            setMasterPassword(password);
            setAttemptsLeft(MAX_ATTEMPTS);
            setLocked(false);
            toast.success('Project unlocked');
        } catch {
            // Record the failed attempt
            const result = recordFailedAttempt(projectId);

            if (result.locked) {
                refreshLockoutState();
                toast.error('Too many failed attempts. Project locked for 3 hours.');
            } else {
                const remaining = MAX_ATTEMPTS - result.attempts;
                setAttemptsLeft(remaining);
                toast.error(
                    remaining > 0
                        ? `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
                        : 'Incorrect master password'
                );
            }

            throw new Error('Incorrect password');
        } finally {
            setUnlocking(false);
        }
    };

    // ----- Handlers -----

    const handleSaveName = async () => {
        if (!newName.trim() || !project) return;
        const supabase = createClient();
        const { error } = await supabase
            .from('projects')
            .update({ name: newName.trim(), updated_at: new Date().toISOString() })
            .eq('id', project.id);

        if (error) {
            toast.error('Failed to update name');
            return;
        }

        setProject({ ...project, name: newName.trim() });
        setEditingName(false);
        toast.success('Name updated');
    };

    const handleDeleteSecret = async (secretId: string) => {
        const supabase = createClient();
        const { error } = await supabase.from('secrets').delete().eq('id', secretId);

        if (error) {
            toast.error('Failed to delete secret');
            return;
        }

        toast.success('Secret deleted');
        setSecrets((prev) => prev.filter((s) => s.id !== secretId));
    };

    const handleEditSecret = (secretId: string, keyName: string, decryptedValue: string) => {
        setEditTarget({ secretId, keyName, decryptedValue });
    };

    const handleDownload = async () => {
        if (!masterPassword) return;
        setShowDownloadConfirm(false);

        try {
            const decrypted = await Promise.all(
                secrets.map(async (secret) => {
                    const value = await decrypt(secret.encrypted_value, secret.iv, secret.salt, masterPassword);
                    return { key: secret.key_name, value };
                })
            );

            const content = generateEnvFile(decrypted);
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `.env`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('.env file downloaded');
        } catch {
            toast.error('Failed to decrypt secrets');
        }
    };

    // ----- Loading state -----

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-050)' }}>
                <Navbar />
                <main className="container-app" style={{ paddingTop: 40, flex: 1 }}>
                    <div className="skeleton" style={{ height: 24, width: 160, marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 16, width: 100, marginBottom: 32 }} />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 'var(--radius-md)' }} />
                    ))}
                </main>
                <Footer />
            </div>
        );
    }

    // ----- Locked state -----

    if (!masterPassword) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-050)' }}>
                <Navbar />
                <main className="container-app" style={{ paddingTop: 40, flex: 1 }}>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn-ghost"
                        style={{ marginBottom: 24, padding: '4px 0' }}
                    >
                        <ArrowLeft size={14} /> Back to projects
                    </button>

                    <div style={{
                        maxWidth: 400,
                        margin: '40px auto',
                        textAlign: 'center',
                    }}>
                        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: locked ? 'rgba(239, 68, 68, 0.12)' : 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: locked ? 'var(--error)' : 'var(--text-tertiary)', transition: 'all 0.3s ease' }}>
                            <Lock size={22} />
                        </div>
                        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 4 }}>{project?.name}</h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 24 }}>
                            {locked
                                ? 'This project is temporarily locked due to too many failed password attempts.'
                                : 'This project is locked. Enter your master password to view and manage secrets.'}
                        </p>

                        <MasterPasswordModal
                            title="Unlock project"
                            description="Enter the master password you set when creating this project."
                            onSubmit={handleUnlock}
                            onClose={() => router.push('/dashboard')}
                            loading={unlocking}
                            remainingAttempts={attemptsLeft}
                            maxAttempts={MAX_ATTEMPTS}
                            lockedOut={locked}
                            lockoutCountdown={locked ? formatCountdown(lockRemainingMs) : undefined}
                        />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ----- Unlocked state -----

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-050)' }}>
            <Navbar />

            <main className="container-app" style={{ paddingTop: 40, paddingBottom: 60, flex: 1 }}>
                <div ref={headerRef} style={{ marginBottom: 32, opacity: 0 }}>
                    {/* Breadcrumb */}
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn-ghost"
                        style={{ marginBottom: 16, padding: '4px 0' }}
                    >
                        <ArrowLeft size={14} /> Back to projects
                    </button>

                    {/* Project name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        {editingName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName();
                                        if (e.key === 'Escape') setEditingName(false);
                                    }}
                                    autoFocus
                                    style={{ fontSize: '1.125rem', fontWeight: 600, padding: '4px 10px' }}
                                />
                                <button className="btn-primary" onClick={handleSaveName} style={{ padding: '4px 12px', fontSize: '0.8125rem' }}>Save</button>
                                <button className="btn-secondary" onClick={() => setEditingName(false)} style={{ padding: '4px 12px', fontSize: '0.8125rem' }}>Cancel</button>
                            </div>
                        ) : (
                            <>
                                <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{project?.name}</h1>
                                <button className="btn-icon" onClick={() => setEditingName(true)} title="Edit name" aria-label="Edit project name">
                                    <Pencil size={14} />
                                </button>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                            {secrets.length} secret{secrets.length !== 1 ? 's' : ''} · Created {new Date(project?.created_at || '').toLocaleDateString()}
                        </span>
                        <span className="badge badge-success"><Key size={10} /> Unlocked</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={16} /> Add secret
                        </button>
                        <button className="btn-secondary" onClick={() => setShowUploadModal(true)}>
                            <Upload size={14} /> Import .env
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={handleDownload}
                            disabled={secrets.length === 0}
                            style={{ opacity: secrets.length > 0 ? 1 : 0.4 }}
                        >
                            <Download size={14} /> Download .env
                        </button>
                    </div>
                </div>

                {/* Secrets list */}
                {secrets.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '56px 24px',
                        border: '1px dashed var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                    }}>
                        <Key size={24} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>No secrets yet</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: 20 }}>
                            Add your first secret or import from an existing .env file.
                        </p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                                <Plus size={16} /> Add secret
                            </button>
                            <button className="btn-secondary" onClick={() => setShowUploadModal(true)}>
                                <Upload size={14} /> Import .env
                            </button>
                        </div>
                    </div>
                ) : (
                    <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {secrets.map((secret) => (
                            <SecretRow
                                key={secret.id}
                                secret={secret}
                                masterPassword={masterPassword}
                                onEdit={handleEditSecret}
                                onDelete={handleDeleteSecret}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            {showAddModal && (
                <AddSecretModal
                    projectId={projectId}
                    masterPassword={masterPassword}
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => { setShowAddModal(false); fetchData(); }}
                />
            )}

            {editTarget && (
                <AddSecretModal
                    projectId={projectId}
                    masterPassword={masterPassword}
                    editMode={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={() => { setEditTarget(null); fetchData(); }}
                />
            )}

            {showUploadModal && (
                <UploadEnvModal
                    projectId={projectId}
                    masterPassword={masterPassword}
                    existingKeys={secrets.map((s) => s.key_name)}
                    onClose={() => setShowUploadModal(false)}
                    onImported={() => { setShowUploadModal(false); fetchData(); }}
                />
            )}

            <Footer />
        </div>
    );
}
