import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import Link from "next/link";

export const metadata = {
  title: "Prevently Dashboard",
  description: "Market vibe analytics platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {/* Simple Navbar */}
        <nav className="flex gap-6 p-4 border-b bg-white shadow-sm">
          <Link href="/" className="hover:underline font-medium">
            Home
          </Link>
          <Link href="/dashboard" className="hover:underline font-medium">
            Dashboard
          </Link>
          <Link href="/companies" className="hover:underline font-medium">
            Companies
          </Link>
        </nav>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
