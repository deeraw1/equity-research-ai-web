import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI Equity Research Analyst — RAG over NSE / SEC Filings",
  description:
    "Citation-backed retrieval Q&A and structured investment memos over Nigerian and US equity filings. Includes DCF and peer-comp valuation triangulation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
