"use client";

import ImageUploader from "@/components/ImageUploader";
import { authStorage } from "@/lib/auth-api";
import { useEffect, useState } from "react";

export default function UploadPage() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Decode JWT to extract username (same as ProfileDropdown)
    const token = authStorage.getToken();
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        if (decoded && decoded.name) {
          setUsername(decoded.name);
        }
      } catch (error) {
        console.error("Error decoding JWT:", error);
      }
    }
  }, []);

  if (!username) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading user info...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* ✅ Pass username into the uploader */}
      <ImageUploader username={username} />
    </main>
  );
}
