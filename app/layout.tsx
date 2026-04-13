import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Where To Meet",
  description: "함께 만날 장소를 정하는 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}