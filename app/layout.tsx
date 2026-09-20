import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Heroes | Performance with Purpose",
  description:
    "Track your game, enter monthly draws and make an impact through charity.",
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