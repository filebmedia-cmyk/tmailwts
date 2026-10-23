import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logout berhasil' });
  res.cookies.delete('admin_session');
  return res;
}
