/**
 * Password Lockout Utility
 *
 * Tracks failed master password attempts per project in localStorage.
 * After 3 consecutive failures the project is locked for 3 hours.
 * A successful unlock clears the lockout state.
 */

const LOCKOUT_KEY_PREFIX = 'dotenv_lockout_';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

interface LockoutState {
    attempts: number;
    lockedUntil: number | null; // epoch ms
}

function storageKey(projectId: string): string {
    return `${LOCKOUT_KEY_PREFIX}${projectId}`;
}

/** Read raw lockout state from localStorage */
function getLockoutState(projectId: string): LockoutState | null {
    try {
        const raw = localStorage.getItem(storageKey(projectId));
        if (!raw) return null;
        return JSON.parse(raw) as LockoutState;
    } catch {
        return null;
    }
}

/** Persist lockout state */
function saveLockoutState(projectId: string, state: LockoutState): void {
    try {
        localStorage.setItem(storageKey(projectId), JSON.stringify(state));
    } catch {
        // Silently fail — localStorage may be full or unavailable
    }
}

/**
 * Check whether a project is currently locked out.
 * If the lockout has expired, it is automatically cleared.
 */
export function isLockedOut(projectId: string): { locked: boolean; remainingMs: number } {
    const state = getLockoutState(projectId);
    if (!state || !state.lockedUntil) {
        return { locked: false, remainingMs: 0 };
    }

    const remaining = state.lockedUntil - Date.now();
    if (remaining <= 0) {
        // Lockout expired — clear it
        clearLockout(projectId);
        return { locked: false, remainingMs: 0 };
    }

    return { locked: true, remainingMs: remaining };
}

/**
 * Record a failed password attempt.
 * Returns the updated number of failed attempts.
 * If MAX_ATTEMPTS is reached, sets the lockout timer.
 */
export function recordFailedAttempt(projectId: string): { attempts: number; locked: boolean } {
    const current = getLockoutState(projectId) || { attempts: 0, lockedUntil: null };

    // If there was a previous lockout that expired, start fresh
    if (current.lockedUntil && current.lockedUntil <= Date.now()) {
        current.attempts = 0;
        current.lockedUntil = null;
    }

    current.attempts += 1;

    if (current.attempts >= MAX_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }

    saveLockoutState(projectId, current);
    return { attempts: current.attempts, locked: current.attempts >= MAX_ATTEMPTS };
}

/** Get remaining allowed attempts (before lockout triggers) */
export function getRemainingAttempts(projectId: string): number {
    const state = getLockoutState(projectId);
    if (!state) return MAX_ATTEMPTS;

    // If lockout expired, treat as fresh
    if (state.lockedUntil && state.lockedUntil <= Date.now()) {
        return MAX_ATTEMPTS;
    }

    return Math.max(0, MAX_ATTEMPTS - state.attempts);
}

/** Clear lockout state for a project (call on successful unlock) */
export function clearLockout(projectId: string): void {
    try {
        localStorage.removeItem(storageKey(projectId));
    } catch {
        // Silently fail
    }
}

export { MAX_ATTEMPTS };
