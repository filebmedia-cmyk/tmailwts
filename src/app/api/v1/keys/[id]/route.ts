import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { repoDeleteApiKey, repoUpdateApiKey } from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/auth';

// PUT /api/v1/keys/[id] - Update name, status or regenerate key
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, any> = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.status !== undefined) {
      if (['active', 'inactive'].includes(body.status)) {
        updates.status = body.status;
      }
    }

    // Optional: regenerate key secret
    if (body.regenerate === true) {
      const rawSecret = crypto.randomBytes(16).toString('hex');
      const newKey = `tm_live_${rawSecret}`;
      updates.key = newKey;
      updates.maskedKey = `tm_live_••••••••${newKey.slice(-4)}`;
    }

    const success = await repoUpdateApiKey(id, updates);
    if (!success) {
      return NextResponse.json({ success: false, error: 'API Key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'API Key updated successfully',
      data: updates,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/keys/[id] - Delete an API key permanently
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const deleted = await repoDeleteApiKey(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: 'API Key not found or already deleted' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'API Key deleted successfully',
  });
}
