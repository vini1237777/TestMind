import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "./Navbar";
import IntroLoader from "./components/IntroLoader";
// import NextTopLoader from "nextjs-toploader";
import HolyLoader from "holy-loader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Skip the intro before paint for returning visitors and reduced motion users */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("tm-intro-seen")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("tm-no-intro")}catch(e){document.documentElement.classList.add("tm-no-intro")}`,
          }}
        />
      </head>
      <body className="bg-white text-black dark:bg-[#020617] dark:text-white">
        <HolyLoader zIndex={999999} />
        <IntroLoader />
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
