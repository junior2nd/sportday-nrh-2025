import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { EventProvider } from "@/lib/contexts/EventContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  variable: '--font-ibm-plex-sans-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "NRSport - Event Platform",
  description: "ระบบกลางสำหรับจัดกิจกรรมหน่วยงาน",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={ibmPlexSansThai.variable}>
      <body className={ibmPlexSansThai.className} suppressHydrationWarning>
        <QueryProvider>
          <EventProvider>
            {children}
          </EventProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

