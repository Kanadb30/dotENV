'use client';

/**
 * Dashboard Page
 *
 * Card grid layout for projects with user name greeting.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreateProjectModal from '@/components/CreateProjectModal';
import DeleteProjectModal from '@/components/DeleteProjectModal';
import toast from 'react-hot-toast';
import anime from 'animejs';
import { Plus, Folder, Trash2, Key, Calendar } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    created_at: string;
    secretCount?: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [userName, setUserName] = useState('');
    const gridRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const fetchProjects = useCallback(async () => {
        const supabase = createClient();

        // Get user name
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'there');
        }

        const { data: projectsData, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Failed to load projects');
            setLoading(false);
            return;
        }

        const counts = await Promise.all(
            (projectsData || []).map(async (proj: Project) => {
                const { count } = await supabase
                    .from('secrets')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', proj.id);
                return { ...proj, secretCount: count || 0 };
            })
        );

        setProjects(counts);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (!loading) {
            anime({
                targets: headerRef.current,
                opacity: [0, 1],
                translateY: [16, 0],
                duration: 400,
                easing: 'easeOutCubic',
            });

            anime({
                targets: gridRef.current?.children,
                opacity: [0, 1],
                translateY: [16, 0],
                delay: anime.stagger(60, { start: 150 }),
                duration: 400,
                easing: 'easeOutCubic',
            });
        }
    }, [loading, projects]);

    const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setDeleteTarget({ id: project.id, name: project.name });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        const supabase = createClient();
        const { error } = await supabase.from('projects').delete().eq('id', deleteTarget.id);

        if (error) {
            toast.error('Failed to delete project');
            setDeleting(false);
            return;
        }

        toast.success('Project deleted');
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        setDeleting(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-050)' }}>
            <Navbar />

            <main className="container-app" style={{ paddingTop: 40, paddingBottom: 60, flex: 1 }}>
                {/* Header */}
                <div ref={headerRef} style={{ marginBottom: 32, opacity: 0 }}>
                    <h1 style={{ fontSize: '1.375rem', fontWeight: 600, marginBottom: 4 }}>
                        Welcome back, {userName}
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 24 }}>
                        {projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace
                    </p>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> New project
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && projects.length === 0 && (
                    <div style={{
                        border: '1px dashed var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '60px 24px',
                        textAlign: 'center',
                    }}>
                        <Folder size={28} style={{ margin: '0 auto 12px', color: 'var(--text-tertiary)' }} />
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>No projects yet</h2>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Create your first project to start managing secrets.
                        </p>
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            <Plus size={16} /> New project
                        </button>
                    </div>
                )}

                {/* Project Cards Grid */}
                {!loading && projects.length > 0 && (
                    <div ref={gridRef} style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 12,
                    }}>
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="card card-interactive"
                                onClick={() => router.push(`/project/${project.id}`)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                    opacity: 0,
                                    position: 'relative',
                                }}
                            >
                                {/* Card header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{
                                        width: 40, height: 40,
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--accent-dim)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--text-tertiary)',
                                    }}>
                                        <Folder size={18} />
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, project)}
                                        className="btn-icon"
                                        style={{ color: 'var(--text-tertiary)', width: 28, height: 28 }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                                        title="Delete project"
                                        aria-label="Delete project"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Project name */}
                                <div>
                                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>
                                        {project.name}
                                    </h3>
                                </div>

                                {/* Meta */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    marginTop: 'auto',
                                    paddingTop: 12,
                                    borderTop: '1px solid var(--border-subtle)',
                                }}>
                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)',
                                    }}>
                                        <Key size={11} /> {project.secretCount} secret{project.secretCount !== 1 ? 's' : ''}
                                    </span>
                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)',
                                    }}>
                                        <Calendar size={11} /> {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />

            {showCreateModal && (
                <CreateProjectModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchProjects();
                    }}
                />
            )}

            {deleteTarget && (
                <DeleteProjectModal
                    projectName={deleteTarget.name}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}
        </div>
    );
}
