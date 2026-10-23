import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { repoCreateMailbox, repoCreateMessage, repoGetMailbox, repoGetSettings } from '@/lib/mongodb';
import { extractOtpAndLinks } from '@/lib/otp-extractor';
import { MessageDocument } from '@/lib/models';

// POST /api/webhook/email - Called by Cloudflare Worker when an email is received
export async function POST(req: NextRequest) {
  try {
    const settings = await repoGetSettings();
    const configuredSecret = process.env.WEBHOOK_SECRET || settings.webhookSecret;

    // Verify webhook secret
    const incomingSecret = req.headers.get('x-webhook-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!incomingSecret || incomingSecret !== configuredSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Extract recipients
    const recipients: string[] = Array.isArray(payload.to)
      ? payload.to.map((t: any) => (typeof t === 'string' ? t : t?.address || '')).filter(Boolean)
      : (typeof payload.to === 'string' ? [payload.to] : [payload.recipient || '']).filter(Boolean);

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Missing recipient email address in "to"' }, { status: 400 });
    }

    const fromAddress = typeof payload.from === 'string'
      ? payload.from
      : payload.from?.address || 'unknown@sender.com';
    const fromName = typeof payload.from === 'object' ? payload.from?.name : undefined;

    const subject = payload.subject || '(No Subject)';
    const textBody = payload.text || '';
    const htmlBody = payload.html || '';

    // Smart extraction for bot OTPs and verification links
    const extracted = extractOtpAndLinks(textBody, htmlBody);

    const now = new Date();
    const ttlMinutes = settings.ttlMinutes || 60;
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const createdMessages: MessageDocument[] = [];

    for (const rawRecipient of recipients) {
      const cleanRecipient = rawRecipient.toLowerCase().trim();
      const [username, domain] = cleanRecipient.split('@');

      if (!domain) continue;

      // Auto-create/ensure mailbox exists (catch-all feature)
      const existingMailbox = await repoGetMailbox(cleanRecipient);
      if (!existingMailbox) {
        await repoCreateMailbox({
          address: cleanRecipient,
          username: username || 'user',
          domain,
          createdAt: now,
          expiresAt,
        });
      }

      const messageDoc: MessageDocument = {
        id: `msg_${crypto.randomUUID()}`,
        mailboxAddress: cleanRecipient,
        from: {
          address: fromAddress,
          name: fromName,
        },
        to: recipients,
        subject,
        text: textBody,
        html: htmlBody,
        otpCode: extracted.otpCode,
        verificationLinks: extracted.verificationLinks,
        attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
        receivedAt: now,
        expiresAt,
        isRead: false,
      };

      await repoCreateMessage(messageDoc);
      createdMessages.push(messageDoc);
    }

    return NextResponse.json({
      success: true,
      deliveredToCount: createdMessages.length,
      extractedOtp: extracted.otpCode || null,
      verificationLinksFound: extracted.verificationLinks.length,
      messageIds: createdMessages.map(m => m.id),
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
