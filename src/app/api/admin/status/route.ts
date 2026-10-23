import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { repoGetSettings } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const settings = await repoGetSettings();
  return NextResponse.json({
    authenticated: true,
    username: settings.adminUsername || 'admin',
    brandName: settings.brandName,
  });
}
