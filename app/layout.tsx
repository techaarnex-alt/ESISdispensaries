import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ESIS Lucknow Laboratory Portal — Demo',
  description: 'Location-separated laboratory test entries and reports for ESIS dispensaries in the Lucknow zone.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
