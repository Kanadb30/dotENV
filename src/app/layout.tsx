import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "dotENV — Secure Secret Manager",
  description:
    "A developer-focused secret manager for storing and retrieving environment variables with end-to-end encryption.",
  keywords: ["env", "secrets", "encryption", "environment variables", "developer tools"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#171717',
              color: '#fafafa',
              border: '1px solid #2a2a2a',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8125rem',
              borderRadius: '8px',
              padding: '10px 14px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#171717',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#171717',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
