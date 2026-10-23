import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';
import { repoDeleteMailbox, repoGetMailbox } from '@/lib/mongodb';

// GET /api/v1/mailbox/[address] - Check mailbox status and expiry
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

  const mailbox = await repoGetMailbox(decodedAddress);
  if (!mailbox) {
    return NextResponse.json({
      success: false,
      error: `Mailbox '${decodedAddress}' not found or has expired`,
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: mailbox,
  });
}

// DELETE /api/v1/mailbox/[address] - Delete mailbox and purge all its messages
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const decodedAddress = decodeURIComponent(address).toLowerCase().trim();

  const auth = await verifyApiAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const result = await repoDeleteMailbox(decodedAddress);

  return NextResponse.json({
    success: true,
    message: `Mailbox '${decodedAddress}' deleted successfully`,
    purgedMessages: result.deletedMessages,
  });
}
