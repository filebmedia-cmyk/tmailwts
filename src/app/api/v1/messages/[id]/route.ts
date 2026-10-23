import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';
import { repoGetMessageById } from '@/lib/mongodb';

// GET /api/v1/messages/[id] - Fetch full content of a specific email
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const auth = await verifyApiAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const message = await repoGetMessageById(id);
  if (!message) {
    return NextResponse.json({
      success: false,
      error: `Email message with ID '${id}' not found or has expired.`,
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: message.id,
      mailboxAddress: message.mailboxAddress,
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      otpCode: message.otpCode || null,
      verificationLinks: message.verificationLinks || [],
      attachments: message.attachments || [],
      receivedAt: message.receivedAt,
      expiresAt: message.expiresAt,
    },
  });
}
