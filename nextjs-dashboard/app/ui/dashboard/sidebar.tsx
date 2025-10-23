"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Newspaper,
  LineChart,
  Tags,
  Settings,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(340);
  const [dragging, setDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- Handle resizing ---
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = Math.min(Math.max(clientX - sidebarLeft, 280), 600);
      setWidth(newWidth);
    };

    const stopDragging = () => setDragging(false);

    if (dragging) {
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("touchmove", handleMove);
      document.addEventListener("mouseup", stopDragging);
      document.addEventListener("touchend", stopDragging);
    }

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("mouseup", stopDragging);
      document.removeEventListener("touchend", stopDragging);
    };
  }, [dragging]);

  return (
    <>
      {/* --- Left Handle --- */}
      <motion.div
        onClick={() => setOpen(true)}
        className="fixed top-1/2 -translate-y-1/2 left-0 z-40 flex items-center justify-center cursor-pointer"
        initial={false}
        animate={{
          width: open ? 0 : 40,
          height: open ? 0 : 80,
          opacity: open ? 0 : 1,
        }}
        whileHover={{
          width: 60,
          backgroundColor: "rgba(0,0,0,0.1)",
        }}
        transition={{ duration: 0.2 }}
        style={{
          borderTopRightRadius: "6px",
          borderBottomRightRadius: "6px",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <span className="text-gray-500 text-xs font-medium select-none rotate-90">
          MENU
        </span>
      </motion.div>

      {/* --- Overlay (blur/dim background) --- */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* --- Drawer --- */}
      <AnimatePresence>
        {open && (
          <motion.aside
            ref={sidebarRef}
            key="drawer"
            initial={{ x: -width }}
            animate={{ x: 0 }}
            exit={{ x: -width }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            style={{ width }}
            className="fixed top-0 left-0 z-50 h-full bg-white/90 backdrop-blur-xl border-r border-gray-200 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h1 className="font-bold text-lg tracking-tight">Prevently</h1>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-black transition p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                <SidebarLink
                  href="/dashboard"
                  icon={<LayoutDashboard size={18} />}
                  label="Dashboard"
                />
                <SidebarLink
                  href="/dashboard/companies"
                  icon={<LineChart size={18} />}
                  label="Companies"
                />
                <SidebarLink
                  href="/dashboard/news"
                  icon={<Newspaper size={18} />}
                  label="News"
                />
                <SidebarLink
                  href="/dashboard/topics"
                  icon={<Tags size={18} />}
                  label="Topics"
                />
              </ul>
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 flex justify-between items-center text-sm text-gray-500">
              <span>Settings</span>
              <Settings size={18} />
            </div>

            {/* Resize handle */}
            <div
              onMouseDown={() => setDragging(true)}
              onTouchStart={() => setDragging(true)}
              className="absolute top-0 right-0 w-1 h-full cursor-ew-resize bg-transparent hover:bg-gray-300/50 active:bg-gray-400/50 transition"
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-black transition"
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </Link>
    </li>
  );
}
