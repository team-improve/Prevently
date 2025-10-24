import "@/app/ui/global.css";
import { inter } from "@/app/ui/fonts";
import ProfileDropdown from "@/components/ProfileDropdown";
import Chatbot from "@/components/Chatbot";

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
      <body
        className={`${inter.className} antialiased bg-gray-50 text-gray-900 flex flex-col min-h-screen`}>
        <ProfileDropdown />
        <Chatbot />
        <div>{children}</div>
      </body>
    </html>
  );
}
