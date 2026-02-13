import type { Metadata } from 'next';
import '@/styles/globals.css';
import AuthProvider from '@/components/layout/AuthProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'SHEFA — Secure Telemedicine Platform',
  description:
    'Consult verified doctors remotely via secure video calls, receive digital prescriptions, and manage medical records with strict access control.',
  keywords: ['telemedicine', 'healthcare', 'doctors', 'video consultation', 'prescriptions'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#124132',
                borderRadius: '12px',
                border: '1px solid #d5f1e3',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
