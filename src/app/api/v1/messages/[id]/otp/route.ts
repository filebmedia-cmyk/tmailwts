import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';
import { repoGetMessageById } from '@/lib/mongodb';
import { extractOtpAndLinks } from '@/lib/otp-extractor';

// GET /api/v1/messages/[id]/otp - Auto-extracted OTP and verification links for bots
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
      error: `Email message '${id}' not found or has expired.`,
    }, { status: 404 });
  }

  // Re-run extractor dynamically if not already cached
  const extraction = extractOtpAndLinks(message.text, message.html);
  const otpCode = message.otpCode || extraction.otpCode || null;
  const verificationLinks = message.verificationLinks?.length ? message.verificationLinks : extraction.verificationLinks;

  return NextResponse.json({
    success: true,
    messageId: message.id,
    mailbox: message.mailboxAddress,
    from: message.from.address,
    subject: message.subject,
    otpCode,
    hasOtp: Boolean(otpCode),
    primaryVerificationLink: verificationLinks[0] || null,
    verificationLinks,
    receivedAt: message.receivedAt,
  });
}
