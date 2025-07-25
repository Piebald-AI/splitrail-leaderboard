import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import Footer from "@/components/footer";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/navbar";
import Main from "@/components/main";
import { ThemeProvider } from "next-themes";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Splitrail",
  description:
    "Blazing fast, single-executable, cross-platform, agentic development monitor ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" enableSystem>
          <AuthSessionProvider>
            <div className="w-full bg-background grid min-h-full grid-rows-[auto_1fr_auto]">
              <Navbar />

              <Main>{children}</Main>

              <Footer />
            </div>
          </AuthSessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
