"use client";

import { useEffect, useState } from "react";
import { authStorage } from "@/lib/auth-api";
import ImageUploader from "@/components/ImageUploader";

export default function AccountPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string>("—");
  const [preferredTopics, setPreferredTopics] = useState<string[]>(["Markets", "Tech", "Energy"]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  // ✅ Decode JWT
  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) return;

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
      if (decoded) {
        setUsername(decoded.name);
        setEmail(decoded.email);
        setJoinedAt(decoded.created_at || "2024-05-01");
      }
    } catch (err) {
      console.error("JWT decode failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fetch / cache profile picture
  useEffect(() => {
    if (!username) return;
    const key = `profile_${username}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      setProfilePic(cached);
      return;
    }

    fetch(`http://localhost:8000/images/${username}_profile`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const img = `data:${data.contentType};base64,${data.data}`;
        localStorage.setItem(key, img);
        setProfilePic(img);
      })
      .catch(() => {});
  }, [username]);

  // ✅ React to upload events
  useEffect(() => {
    const refreshPic = () => {
      if (!username) return;
      const cached = localStorage.getItem(`profile_${username}`);
      if (cached) setProfilePic(cached);
    };
    window.addEventListener("profilePicUpdated", refreshPic);
    return () => window.removeEventListener("profilePicUpdated", refreshPic);
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading your account...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-8">
          <div className="flex items-center space-x-6">
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile"
                className="w-24 h-24 rounded-full border-2 border-blue-500 object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold border-2 border-blue-500">
                {username ? username.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{username}</h1>
              <p className="text-gray-600">{email || "No email linked"}</p>
              <p className="text-sm text-gray-400">Joined {joinedAt}</p>
            </div>
          </div>

          <div className="mt-6 md:mt-0">
            <ImageUploader username={username || ""} />
          </div>
        </div>

        {/* Market Persona */}
        <div className="mb-10 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            🧠 Your Market Persona
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Based on your recent sentiment interactions and article selections, you lean towards a
            <span className="font-semibold text-blue-700"> data-driven, cautious optimism </span>
            approach. Your vibe aligns with investors who favor stable growth sectors and avoid
            short-term volatility.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bg-blue-600/10 text-blue-700 text-xs px-3 py-1 rounded-full">
              Stable Growth
            </span>
            <span className="bg-green-600/10 text-green-700 text-xs px-3 py-1 rounded-full">
              ESG Focused
            </span>
            <span className="bg-yellow-600/10 text-yellow-700 text-xs px-3 py-1 rounded-full">
              Long-term Outlook
            </span>
          </div>
        </div>

        {/* Preferences */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl border p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📰 Preferred Topics</h3>
            <ul className="space-y-2">
              {preferredTopics.map((topic) => (
                <li
                  key={topic}
                  className="text-gray-700 text-sm flex items-center justify-between bg-white rounded-md px-3 py-2 shadow-sm"
                >
                  {topic}
                  <button
                    onClick={() =>
                      setPreferredTopics(preferredTopics.filter((t) => t !== topic))
                    }
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex">
              <input
                type="text"
                placeholder="Add topic..."
                className="border rounded-l-md px-3 py-1 w-full text-sm outline-none focus:ring-1 focus:ring-blue-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    setPreferredTopics([...preferredTopics, e.currentTarget.value.trim()]);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button className="bg-blue-600 text-white px-3 rounded-r-md hover:bg-blue-700 text-sm">
                Add
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">⚙️ Settings</h3>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-700">
                Auto-refresh market sentiment data
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={() => setAutoRefresh(!autoRefresh)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Dark mode (coming soon)</span>
              <div className="text-gray-400 text-xs border px-2 py-1 rounded-md">
                Beta
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-gray-500 text-sm">
          <p>
            Need help? Contact <a href="mailto:support@prevently.world" className="text-blue-600 underline">support@prevently.world</a>
          </p>
        </div>
      </div>
    </main>
  );
}
