// frontend/app/layout.tsx - WITH AUTO THEME
"use client"; // Add this line for client-side theme detection

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  useEffect(() => {
    // Check system preference
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const html = document.documentElement;
    
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, []);

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}