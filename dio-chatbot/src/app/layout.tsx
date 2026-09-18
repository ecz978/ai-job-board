import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Un dialogo con Dio",
  description:
    "Un'esperienza di dialogo spirituale ispirata alla tradizione cristiano-cattolica, generata da intelligenza artificiale.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen text-ink">{children}</body>
    </html>
  );
}
