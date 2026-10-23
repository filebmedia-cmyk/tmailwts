import { Suspense } from 'react';
import MailboxPage from '@/app/mailbox/page';

interface InboxRootPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function InboxRootContent({ searchParams }: InboxRootPageProps) {
  const sp = searchParams ? await searchParams : {};
  const addr = typeof sp?.address === 'string' ? sp.address : (typeof sp?.email === 'string' ? sp.email : undefined);

  return <MailboxPage initialAddress={addr} />;
}

export default function InboxRootPage(props: InboxRootPageProps) {
  return (
    <Suspense fallback={null}>
      <InboxRootContent {...props} />
    </Suspense>
  );
}
