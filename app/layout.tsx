import { Toaster } from "react-hot-toast";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Toaster />
        <nav className="w-full bg-amber-300 h-12 flex items-center px-4">
          <h1 className="font-semibold">TestMind</h1>
        </nav>
        {children}
      </body>
    </html>
  );
}
