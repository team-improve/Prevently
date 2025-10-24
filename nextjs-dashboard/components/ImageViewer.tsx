"use client";
import { useEffect, useState } from "react";

export default function ImageViewer({ id }: { id: string }) {
  const [imageData, setImageData] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/images/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setImageData(`data:${data.contentType};base64,${data.data}`);
      })
      .catch(() => setImageData(""));
  }, [id]);

  if (!imageData) return <p>Loading...</p>;

  return <img src={imageData} alt={id} className="rounded-xl shadow-md" />;
}
