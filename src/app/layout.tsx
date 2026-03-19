import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orvelterhof — Beheer",
  description: "Beheerapplicatie voor Orvelterhof groepsaccommodatie",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
