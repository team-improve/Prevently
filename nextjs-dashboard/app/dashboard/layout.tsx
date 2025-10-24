import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import Navbar from "../ui/NavBar";

export const metadata = {
  title: "Prevently Dashboard",
  description: "Market vibe analytics platform",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <div
    className={`${inter.className} antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`}
    >
        <div className="flex-1">{children}</div>
      </div>

  );
}