import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "منصة التعليم المصرية | Egyptian Education Platform",
  description: "منصة تعليمية متكاملة للمنهج المصري من الصف الرابع حتى الثانوية مدعومة بالذكاء الاصطناعي. دروس، اختبارات، وتتبع أداء.",
  openGraph: {
    title: "منصة التعليم المصرية — دراسة ذكية للمنهج المصري",
    description: "محتوى مطابق للمنهج، اختبارات ذكية، وتقارير أداء للطلاب",
    images: ["/assets/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <meta name="description" content="منصة تعليمية متكاملة للمنهج المصري من الصف الرابع حتى الثانوية مدعومة بالذكاء الاصطناعي. دروس، اختبارات، وتتبع أداء." />
        <meta property="og:title" content="منصة التعليم المصرية — دراسة ذكية للمنهج المصري" />
        <meta property="og:description" content="محتوى مطابق للمنهج، اختبارات ذكية، وتقارير أداء للطلاب" />
        <meta property="og:image" content="/assets/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="8d99043c-25ea-4e96-aa89-af09482cbae3"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster />
        </Providers>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}