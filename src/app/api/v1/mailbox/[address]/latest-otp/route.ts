import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';
import { repoGetMessagesForMailbox } from '@/lib/mongodb';
import { extractOtpAndLinks } from '@/lib/otp-extractor';

// GET /api/v1/mailbox/[address]/latest-otp - One-step polling for bot automation
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const decodedAddress = decodeURIComponent(address).toLowerCase().trim();

  const auth = await verifyApiAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const messages = await repoGetMessagesForMailbox(decodedAddress);

  if (messages.length === 0) {
    return NextResponse.json({
      success: true,
      hasEmail: false,
      address: decodedAddress,
      message: 'No emails received yet for this mailbox. Please poll again in a few seconds.',
      otpCode: null,
      verificationLink: null,
    });
  }

  // Get the most recent email
  const latest = messages[0];
  const extraction = extractOtpAndLinks(latest.text, latest.html);
  const otpCode = latest.otpCode || extraction.otpCode || null;
  const verificationLinks = latest.verificationLinks?.length ? latest.verificationLinks : extraction.verificationLinks;

  return NextResponse.json({
    success: true,
    hasEmail: true,
    address: decodedAddress,
    messageId: latest.id,
    from: latest.from.address,
    subject: latest.subject,
    otpCode,
    verificationLink: verificationLinks[0] || null,
    allLinks: verificationLinks,
    receivedAt: latest.receivedAt,
  });
}
