import { Suspense } from 'react';
import MailboxPage from '@/app/mailbox/page';

interface InboxEmailPageProps {
  params: Promise<{ email: string }>;
}

async function InboxEmailContent({ params }: InboxEmailPageProps) {
  const { email } = await params;
  const decoded = decodeURIComponent(email || '').trim().toLowerCase();

  return <MailboxPage initialAddress={decoded} />;
}

export default function InboxEmailPage(props: InboxEmailPageProps) {
  return (
    <Suspense fallback={null}>
      <InboxEmailContent {...props} />
    </Suspense>
  );
}
