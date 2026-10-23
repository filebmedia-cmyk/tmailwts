import { NextRequest, NextResponse } from 'next/server';
import { repoGetSettings, repoUpdateSettings } from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/auth';

// GET /api/v1/settings - Get system branding and public settings
export async function GET() {
  const settings = await repoGetSettings();
  return NextResponse.json({
    success: true,
    data: {
      brandName: settings.brandName,
      brandTagline: settings.brandTagline,
      defaultDomain: settings.defaultDomain,
      ttlMinutes: settings.ttlMinutes,
      // Hide sensitive secrets from public GET
      hasMasterKey: Boolean(settings.masterAdminKey),
    },
  });
}

// PUT /api/v1/settings - Update system settings (Admin only)
export async function PUT(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, any> = {};

    if (body.brandName !== undefined) updates.brandName = String(body.brandName).trim();
    if (body.brandTagline !== undefined) updates.brandTagline = String(body.brandTagline).trim();
    if (body.defaultDomain !== undefined) updates.defaultDomain = String(body.defaultDomain).toLowerCase().trim();
    if (typeof body.ttlMinutes === 'number' && body.ttlMinutes > 0) updates.ttlMinutes = body.ttlMinutes;
    if (body.masterAdminKey !== undefined && String(body.masterAdminKey).trim().length >= 4) {
      updates.masterAdminKey = String(body.masterAdminKey).trim();
    }
    if (body.webhookSecret !== undefined && String(body.webhookSecret).trim().length >= 8) {
      updates.webhookSecret = String(body.webhookSecret).trim();
    }

    const updated = await repoUpdateSettings(updates);

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      data: {
        brandName: updated.brandName,
        brandTagline: updated.brandTagline,
        defaultDomain: updated.defaultDomain,
        ttlMinutes: updated.ttlMinutes,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
