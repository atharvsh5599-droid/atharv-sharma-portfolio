import ReactLenis from 'lenis/react';
import { ViewTransitions } from 'next-view-transitions';

import UmamiAnalytics from '@/components/analytics/UmamiAnalytics';
import ChatBubble from '@/components/common/ChatBubble';
import Footer from '@/components/common/Footer';
import Navbar from '@/components/common/Navbar';
import OnekoCat from '@/components/common/OnekoCat';
import { Quote } from '@/components/common/Quote';
import { ThemeProvider } from '@/components/common/ThemeProviders';
import { Toaster } from '@/components/ui/sonner';
import { generateMetadata as getMetadata } from '@/config/Meta';

import './globals.css';

export const metadata = getMetadata('/');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <body className={`font-hanken-grotesk antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReactLenis root>
              <Navbar />
              {children}
              <Toaster richColors position="top-right" />
              <OnekoCat />
              <Quote />
              <Footer />
              <ChatBubble />
              <UmamiAnalytics />
            </ReactLenis>
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
