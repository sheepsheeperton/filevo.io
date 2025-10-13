import './globals.css';
import type { Metadata } from 'next';
import { inter, mono } from './fonts';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = { title: 'Filevo', description: 'Document requests for property managers' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} font-sans bg-bg text-fg`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
