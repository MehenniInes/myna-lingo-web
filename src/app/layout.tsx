import type { Metadata } from "next";
import "./globals.css";
import NotificationsPanel from "@/components/NotificationsPanel";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Myna Lingo",
  description: "Learn languages by actually speaking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="sticky top-0 z-40 bg-cream/80 backdrop-blur border-b border-myna-charcoal/10">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="font-display text-xl font-bold text-myna-charcoal"
            >
              🐦 Myna Lingo
            </Link>
            <div className="flex items-center gap-4">
              <UserMenu />
              <NotificationsPanel />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}