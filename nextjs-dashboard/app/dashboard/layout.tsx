import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import Navbar from "@/app/ui/NavBar";
import Sidebar from "@/app/ui/dashboard/sidebar"; // ✅ Import your sidebar

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
      {/* Global top navigation */}
      <Navbar />

      {/* Main content area */}
      <div className="pt-12 flex flex-1 relative">
        {/* ✅ Sidebar for extra info */}
        <Sidebar />

        {/* ✅ Dashboard page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
