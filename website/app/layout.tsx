import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: "Mario's Signature Limousine | Houston",
  description:
    'Meet a distinctive custom white SUV limousine. Explore the cabin and plan your Houston occasion.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
