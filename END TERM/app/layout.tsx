import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SlotSync — Campus Resource Booking',
  description: 'Conflict-free campus resource booking for labs, study rooms, and sports courts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased selection:bg-indigo-100 selection:text-indigo-800">
        {children}
      </body>
    </html>
  );
}
