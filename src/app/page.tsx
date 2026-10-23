import { Suspense } from 'react';
import MailboxPage from './mailbox/page';

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function HomeContent({ searchParams }: HomePageProps) {
  const sp = searchParams ? await searchParams : {};
  const addr = typeof sp?.address === 'string' ? sp.address : (typeof sp?.email === 'string' ? sp.email : undefined);

  return <MailboxPage initialAddress={addr} />;
}

export default function HomePage(props: HomePageProps) {
  return (
    <Suspense fallback={null}>
      <HomeContent {...props} />
    </Suspense>
  );
}
