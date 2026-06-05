import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "신지원 업무일지 대시보드",
  description: "편집부 팀 업무일지 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${geist.className} min-h-full bg-gray-50`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
