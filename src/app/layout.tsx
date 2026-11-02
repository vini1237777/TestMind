import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import HolyLoader from "holy-loader";
import "react-loading-skeleton/dist/skeleton.css";
import "./globals.css";
import AppShell from "./components/shell/AppShell";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  title: "TestMind · AI QA workspace",
  description:
    "Turn a feature spec into a reviewed test suite. LangGraph workflows, schema validated model output, every run traced.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>
        <HolyLoader zIndex={999999} color="var(--accent)" />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--panel)",
                color: "var(--fg)",
                border: "1.5px solid var(--fg)",
                boxShadow: "var(--hard-sm)",
                fontSize: 13,
              },
            }}
          />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
