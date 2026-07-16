import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GreenMesh — AI-Powered Distributed GPU Compute Marketplace',
  description:
    'Rent idle GPU capacity worldwide. AI-optimized scheduling, carbon-aware routing, automatic job migration, and real-time health monitoring. Cheaper compute, greener planet.',
  keywords: ['GPU marketplace', 'distributed computing', 'AI scheduling', 'carbon optimization', 'ML training'],
  openGraph: {
    title: 'GreenMesh — Distributed GPU Marketplace',
    description: 'AI-powered GPU compute marketplace with carbon-aware scheduling',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mesh-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
