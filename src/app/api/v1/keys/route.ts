import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { repoCreateApiKey, repoListApiKeys } from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/auth';
import { ApiKeyDocument } from '@/lib/models';

// GET /api/v1/keys - List all API keys (Admin Master Key required)
export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const keys = await repoListApiKeys();
  return NextResponse.json({
    success: true,
    count: keys.length,
    data: keys,
  });
}

// POST /api/v1/keys - Generate a new API key
export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name || 'Bot API Key').trim();
    const customKey = body.customKey?.trim();

    // Generate token: tm_live_...
    const rawSecret = customKey || crypto.randomBytes(16).toString('hex');
    const fullKey = customKey || `tm_live_${rawSecret}`;
    const maskedKey = `tm_live_••••••••${fullKey.slice(-4)}`;

    const newKeyDoc: ApiKeyDocument = {
      id: crypto.randomUUID(),
      name,
      key: fullKey,
      maskedKey,
      createdAt: new Date(),
      status: 'active',
      totalRequests: 0,
    };

    await repoCreateApiKey(newKeyDoc);

    return NextResponse.json({
      success: true,
      message: 'API Key created successfully. Store this key safely as it cannot be shown again in plain text after refresh.',
      data: newKeyDoc,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate API Key',
    }, { status: 500 });
  }
}
