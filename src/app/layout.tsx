import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "./Navbar";
import IntroLoader from "./components/IntroLoader";
// import NextTopLoader from "nextjs-toploader";
import HolyLoader from "holy-loader";
import { getCurrentUser } from "@/src/lib/auth/session";
// IBM Plex Sans, served with the app so the build never has to download it.
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
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
          <Navbar email={user?.email ?? null} />
          <main className="min-h-screen">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
