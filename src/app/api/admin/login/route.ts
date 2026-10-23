import { NextRequest, NextResponse } from 'next/server';
import { repoGetSettings } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan Password wajib diisi.' },
        { status: 400 }
      );
    }

    const settings = await repoGetSettings();

    // Verify credentials
    const validUsername = settings.adminUsername || 'admin';
    const validPassword = settings.adminPassword || 'admin123';

    if (username !== validUsername || password !== validPassword) {
      return NextResponse.json(
        { success: false, error: 'Username atau Password salah!' },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = settings.masterAdminKey || `session_${validUsername}_${validPassword}`;

    const res = NextResponse.json({
      success: true,
      message: 'Login berhasil!',
      token: sessionToken,
      username: validUsername,
    });

    // Set HTTP cookie for seamless admin page authentication
    res.cookies.set('admin_session', sessionToken, {
      httpOnly: false, // Accessible to frontend scripts for convenience
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
