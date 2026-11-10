import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "./Navbar";
import IntroLoader from "./components/IntroLoader";
// import NextTopLoader from "nextjs-toploader";
import HolyLoader from "holy-loader";
import { getCurrentUser } from "@/src/lib/auth/session";
import { IBM_Plex_Sans } from "next/font/google";

// A sans made for technical products: clear at small sizes, with real weights for headings.
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex", display: "swap" });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning className={plex.variable}>
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
          <Navbar email={user?.email ?? null} />
          <main className="min-h-screen">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
