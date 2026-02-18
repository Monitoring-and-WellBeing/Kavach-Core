import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { QueryProvider } from "@/lib/query-client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KAVACH AI",
  description: "Student Safety & Digital Wellbeing Platform",
  manifest: "/manifest.json",
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
