'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function DownloadPage() {
  const params = useParams();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError('');

      const response = await fetch(`/api/download/${params.fileId}`);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Download failed');
        return;
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'download';

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Download File</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`w-full py-3 px-4 rounded-md text-white ${
            downloading
              ? 'bg-gray-400'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {downloading ? 'Downloading...' : 'Download File'}
        </button>

        <p className="mt-4 text-sm text-gray-600">
          🔒 This file is encrypted and will be decrypted during download
        </p>
      </div>
    </div>
  );
}
