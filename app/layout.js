import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata = {
  title: 'SSI Data Insight | Next.js Edge',
  description: 'Live Market Data Powered By Cloudflare KV & Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={outfit.className}>
        <div className="glass-bg"></div>
        {children}
      </body>
    </html>
  );
}
