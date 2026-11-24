import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WasteValu — Turn your trash into rupiah with AI',
  description:
    'Snap a photo of household waste and WasteValu classifies it with on-device AI, estimates its rupiah value from real bank-sampah prices, and shows the nearest waste bank in Jakarta.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
