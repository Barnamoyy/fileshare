"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Background from "@/assets/background.jpg";
import CircularProgressBar from "@/components/CircularProgressBar";

export default function DownloadPage() {
  const [fileName, setFileName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const { fileId } = useParams();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/metadata/${fileId}`);
        const data = await response.json();

        if (response.ok) {
          setFileName(data.fileName);
          setOwnerName(data.ownerName);
        } else {
          setError(data.error || "Failed to fetch file details.");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      }
    };

    if (fileId) {
      fetchMetadata();
    }
  }, [fileId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(`/api/download/${fileId}`);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to download file.");
        setIsDownloading(false);
        return;
      }

      const contentLength = response.headers.get("Content-Length");
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
        loaded += value.length;
        setDownloadProgress(Math.round((loaded / total) * 100));
      }

      const blob = new Blob(chunks, {
        type: response.headers.get("Content-Type"),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsDownloading(false);
      setDownloadProgress(100);
    } catch (err) {
      console.error("Download error:", err);
      setError("An unexpected error occurred during download.");
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-xl font-semibold text-red-500 mb-4 text-black">Error</h1>
          <p className="text-black">{error}</p>
        </div>
      </div>
    );
  }

  if (!fileName && !isDownloading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-black">Loading file details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Image
        src={Background}
        alt="background"
        className="w-full h-full absolute top-0 left-0 z-10"
      />

      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center z-50 flex flex-col justify-center items-center">
        <h1 className="text-xl font-semibold mb-4 text-black">Download File</h1>
        <p className="mb-4 text-black">
          Download <strong>{fileName}</strong> by <strong>{ownerName}</strong>
        </p>
        {isDownloading && <CircularProgressBar progress={downloadProgress} />}
        <Button onClick={handleDownload} className="w-full mt-4">
          Download
        </Button>
      </div>
    </div>
  );
}
