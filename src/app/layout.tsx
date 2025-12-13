import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "./Navbar";
// import NextTopLoader from "nextjs-toploader";
import "react-loading-skeleton/dist/skeleton.css";
import HolyLoader from "holy-loader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-black dark:bg-[#020617] dark:text-white">
        <HolyLoader zIndex={999999} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <Toaster />
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
