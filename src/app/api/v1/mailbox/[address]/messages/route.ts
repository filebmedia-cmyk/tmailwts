import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';
import { repoGetMessagesForMailbox } from '@/lib/mongodb';

// GET /api/v1/mailbox/[address]/messages - Fetch incoming emails for mailbox
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const decodedAddress = decodeURIComponent(address).toLowerCase().trim();

  // Authentication check (also allow public frontend checking with optional auth or API key)
  const auth = await verifyApiAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const url = new URL(req.url);
  const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

  let messages = await repoGetMessagesForMailbox(decodedAddress);

  if (unreadOnly) {
    messages = messages.filter(m => !m.isRead);
  }

  if (limitParam > 0) {
    messages = messages.slice(0, limitParam);
  }

  return NextResponse.json({
    success: true,
    address: decodedAddress,
    count: messages.length,
    messages: messages.map(m => ({
      id: m.id,
      from: m.from,
      to: m.to,
      subject: m.subject || '(No Subject)',
      receivedAt: m.receivedAt,
      isRead: m.isRead,
      otpCode: m.otpCode || null,
      verificationLinks: m.verificationLinks || [],
      hasAttachments: Boolean(m.attachments && m.attachments.length > 0),
      attachmentCount: m.attachments ? m.attachments.length : 0,
      preview: (m.text || '').slice(0, 150),
    })),
  });
}
