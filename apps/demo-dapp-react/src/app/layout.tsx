import React from 'react';
import CinacoinClientProvider from './CinacoinClientProvider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Cinacoin Demo dApp</title>
        <meta name="description" content="Comprehensive Cinacoin SDK integration demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <CinacoinClientProvider>
          {children}
        </CinacoinClientProvider>
      </body>
    </html>
  );
}
