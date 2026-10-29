import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partner Finder",
  description: "Paste a startup's URL, get ranked partners with outreach drafts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
