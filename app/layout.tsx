import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Equity Research Analyst — RAG over NSE / SEC Filings",
  description:
    "Citation-backed retrieval Q&A and structured investment memos over Nigerian and US equity filings. Includes DCF and peer-comp valuation triangulation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
