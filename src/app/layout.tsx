import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brew | Reddit + Gemini Powered Startup Idea Hub",
  description: "Explore business categories and discover actionable startup/product ideas curated from active Reddit discussions and decoded by Gemini API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-250">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {children}
          </main>
          <footer className="border-t border-border/80 bg-background/50 backdrop-blur-sm py-8 text-center text-xs text-muted transition-colors duration-250">
            <div className="max-w-7xl mx-auto px-4">
              <p>© {new Date().getFullYear()} Brew. An idea hub, not a pain hub.</p>
              <p className="mt-1 opacity-70">
                Grounding observations in real discussions. No complaints, just opportunities.
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
