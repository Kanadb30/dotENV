/**
 * Auth Callback Route
 *
 * Handles the exchange of an auth code for a session after email verification
 * or OAuth login. Redirects to dashboard on success or login page on error.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page or login
    return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate`);
}
