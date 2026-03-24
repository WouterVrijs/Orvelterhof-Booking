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
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
