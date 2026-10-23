import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TMail - Disposable Temporary Email Service',
  description: 'Fast, secure, and disposable temporary email service with automated OTP extraction and dedicated bot API endpoints.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css2?family=Kadwa:wght@400;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Anti-flicker theme loader script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('tmail_theme');
                if (saved === 'light') {
                  document.documentElement.classList.remove('dark');
                } else if (saved === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-['Poppins',sans-serif] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {children}
      </body>
    </html>
  );
}
