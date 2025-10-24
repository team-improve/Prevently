"use client";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

export default function ImageUploader({ username }: { username: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const upload = async () => {
    if (!file) return alert("Please select an image first!");
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`http://localhost:8000/images/upload/${username}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      // ✅ Cache the new profile picture
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          localStorage.setItem(`profile_${username}`, reader.result);
          window.dispatchEvent(new Event("profilePicUpdated"));
        }
      };
      reader.readAsDataURL(file);

      setMessage("✅ Profile picture updated!");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm w-full max-w-xs">
      
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md 
                   file:border-0 file:text-sm file:font-medium 
                   file:bg-blue-50 file:text-blue-700 
                   hover:file:bg-blue-100 cursor-pointer"
      />

      <button
        onClick={upload}
        disabled={uploading}
        className={`w-full py-2 rounded-md text-white font-medium flex items-center justify-center gap-2 transition-all duration-150 ${
          uploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Uploading...</span>
          </>
        ) : (
          "Upload"
        )}
      </button>

      {message && (
        <p
          className={`text-sm ${
            message.startsWith("✅")
              ? "text-green-600"
              : message.startsWith("❌")
              ? "text-red-500"
              : "text-gray-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
