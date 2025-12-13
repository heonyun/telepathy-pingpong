import './globals.css';
import ServiceWorkerRegister from './ServiceWorkerRegister';

export const metadata = {
  title: 'One-Touch Telepathy',
  description: 'Telepathy with just a touch',
  manifest: '/manifest.json',
  themeColor: '#0f0c29',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
