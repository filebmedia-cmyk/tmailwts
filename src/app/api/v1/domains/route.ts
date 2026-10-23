import { NextRequest, NextResponse } from 'next/server';
import { repoAddDomain, repoDeleteDomain, repoListDomains } from '@/lib/mongodb';
import { verifyAdminAuth } from '@/lib/auth';

// GET /api/v1/domains - Public list of active domains available for generating emails
export async function GET() {
  const domains = await repoListDomains();
  return NextResponse.json({
    success: true,
    count: domains.length,
    domains: domains.filter(d => d.isActive).map(d => ({
      domain: d.domain,
      isDefault: d.isDefault,
    })),
  });
}

// POST /api/v1/domains - Add a new domain (Admin only)
export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const domainName = (body.domain || '').toLowerCase().trim();

    if (!domainName || !domainName.includes('.')) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a valid domain name (e.g. oursastore.com)',
      }, { status: 400 });
    }

    const doc = await repoAddDomain(domainName);
    return NextResponse.json({
      success: true,
      message: `Domain '${domainName}' added successfully`,
      data: doc,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/domains - Remove a domain (Admin only)
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const url = new URL(req.url);
  const domain = url.searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ success: false, error: 'Query parameter ?domain=... is required' }, { status: 400 });
  }

  await repoDeleteDomain(domain);
  return NextResponse.json({
    success: true,
    message: `Domain '${domain}' removed successfully`,
  });
}
