import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyApiAuth } from '@/lib/auth';
import { repoCreateMailbox, repoGetSettings, repoListDomains } from '@/lib/mongodb';
import { MailboxDocument } from '@/lib/models';
import { generateStructuredUsername } from '@/lib/name-generator';

// POST /api/v1/mailbox/create - Generate a new temporary mailbox
export async function POST(req: NextRequest) {
  const auth = await verifyApiAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const settings = await repoGetSettings();
    const activeDomains = await repoListDomains();
    
    // Choose domain
    let domain = (body.domain || '').toLowerCase().trim();
    if (!domain) {
      const defaultDom = activeDomains.find(d => d.isDefault && d.isActive) || activeDomains.find(d => d.isActive);
      domain = defaultDom ? defaultDom.domain : settings.defaultDomain;
    } else {
      // Validate that the requested domain is in the allowed active domains list
      const isValidDomain = activeDomains.some(d => d.domain === domain && d.isActive);
      if (!isValidDomain) {
        return NextResponse.json({
          success: false,
          error: `Domain '${domain}' is not active or not supported. Available domains: ${activeDomains.filter(d => d.isActive).map(d => d.domain).join(', ')}`,
        }, { status: 400 });
      }
    }

    // Choose username
    let username = (body.username || '').toLowerCase().trim();
    if (!username) {
      // Generate clean, structured, and realistic human-like username (e.g., alex.miller, sarah.smith24)
      username = generateStructuredUsername();
    } else {
      // Sanitize username (alphanumeric, dots, dashes, underscores)
      username = username.replace(/[^a-z0-9._-]/g, '');
      if (username.length < 2 || username.length > 40) {
        return NextResponse.json({
          success: false,
          error: 'Username must be between 2 and 40 characters (alphanumeric, dots, dashes, underscores only).',
        }, { status: 400 });
      }
    }

    const fullAddress = `${username}@${domain}`;
    const ttlMinutes = typeof body.ttlMinutes === 'number' && body.ttlMinutes > 0 ? body.ttlMinutes : settings.ttlMinutes;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const mailboxDoc: MailboxDocument = {
      address: fullAddress,
      username,
      domain,
      createdAt: now,
      expiresAt,
    };

    await repoCreateMailbox(mailboxDoc);

    const origin = req.nextUrl.origin;

    return NextResponse.json({
      success: true,
      message: 'Mailbox ready to receive emails',
      data: {
        address: fullAddress,
        username,
        domain,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        ttlMinutes,
        endpoints: {
          messages: `${origin}/api/v1/mailbox/${encodeURIComponent(fullAddress)}/messages`,
          delete: `${origin}/api/v1/mailbox/${encodeURIComponent(fullAddress)}`,
          webInbox: `${origin}/inbox/${encodeURIComponent(fullAddress)}`,
          directUrl: `${origin}/${encodeURIComponent(fullAddress)}`,
        },
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create mailbox',
    }, { status: 500 });
  }
}
