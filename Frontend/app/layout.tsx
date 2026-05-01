import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveTalk - Record & Transcribe",
  description: "Record meetings and get real-time transcriptions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

