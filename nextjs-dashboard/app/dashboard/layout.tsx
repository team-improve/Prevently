import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import Navbar from "@/app/ui/NavBar";

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
    
      <div
        className={`${inter.className} antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`}
      >
        <Navbar />
        <div className="pt-12 flex-1">{children}</div>
      </div>
    
  );
}
