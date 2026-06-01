import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "🎉 SIÊU HỘI KHUI TÚI MÙ 1/6 - NHẬN THẺ GARENA 500K! 🎁",
  description: "Sự kiện khui túi mù Garena siêu to khổng lồ nhân dịp Quốc tế Thiếu nhi 1/6 cực bựa, cực hài hước! Thử vận may của bạn ngay!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

