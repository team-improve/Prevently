"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";

export default function Landing() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api("/auth/status")
      .then(setUser)
      .catch(() => {});
  }, []);

  type LoginResponse = { url: string };

  const login = async () => {
    const res = await api<LoginResponse>("/auth/login", { method: "POST" });
    if (res.url) window.location.href = res.url;
  };
  
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-3xl font-bold mb-4">Predictly</h1>
      <p className="text-gray-600 mb-8">AI-powered daily market sentiment.</p>
      <button onClick={login} className="bg-black text-white px-6 py-3 rounded-xl">
        Login with Google
      </button>
    </div>
  );
}
