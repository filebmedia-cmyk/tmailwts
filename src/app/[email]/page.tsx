import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import MailboxPage from '@/app/mailbox/page';

interface DirectEmailPageProps {
  params: Promise<{ email: string }>;
}

async function DirectEmailContent({ params }: DirectEmailPageProps) {
  const { email } = await params;
  const decoded = decodeURIComponent(email || '').trim().toLowerCase();

  // Hanya proses jika berformat email (mengandung karakter @)
  if (!decoded || !decoded.includes('@')) {
    notFound();
  }

  return <MailboxPage initialAddress={decoded} />;
}

export default function DirectEmailPage(props: DirectEmailPageProps) {
  return (
    <Suspense fallback={null}>
      <DirectEmailContent {...props} />
    </Suspense>
  );
}
