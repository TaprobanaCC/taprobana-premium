import './globals.css';

export const metadata = {
  title: 'Taprobana Sports Club Digital Platform',
  description: 'Premium digital home of Taprobana Sports Club since 2013.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
