import { NextRequest, NextResponse } from 'next/server';
import { repoGetSettings, repoUpdateSettings } from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const currentPassword = (body.currentPassword || '').trim();
    const newUsername = (body.newUsername || '').trim();
    const newPassword = (body.newPassword || '').trim();

    const settings = await repoGetSettings();

    // Verify current password first
    if (currentPassword !== settings.adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Password saat ini salah. Perubahan dibatalkan.' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};

    if (newUsername) {
      if (newUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: 'Username minimal 3 karakter.' },
          { status: 400 }
        );
      }
      updates.adminUsername = newUsername;
    }

    if (newPassword) {
      if (newPassword.length < 5) {
        return NextResponse.json(
          { success: false, error: 'Password baru minimal 5 karakter.' },
          { status: 400 }
        );
      }
      updates.adminPassword = newPassword;
      // Sync masterAdminKey as well
      updates.masterAdminKey = newPassword;
    }

    const updated = await repoUpdateSettings(updates);

    const newSessionToken = updated.masterAdminKey;
    const res = NextResponse.json({
      success: true,
      message: 'Kredensial login admin berhasil diperbarui!',
      data: {
        username: updated.adminUsername,
      },
    });

    res.cookies.set('admin_session', newSessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
