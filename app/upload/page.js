'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function UploadPage() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [shareableUrl, setShareableUrl] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [expiresAt, setExpiresAt] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expiryHours', expiryHours.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.shareableUrl) {
        setShareableUrl(data.shareableUrl);
        setExpiresAt(new Date(data.expiresAt).toLocaleString());
        alert('File uploaded and encrypted successfully!');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    alert('Link copied to clipboard!');
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Secure File Upload</h1>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Expiry Time (hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={expiryHours}
              onChange={(e) => setExpiryHours(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <button
            type="submit"
            disabled={!file || uploading}
            className={`w-full py-2 px-4 rounded-md text-white ${
              !file || uploading
                ? 'bg-gray-400'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {uploading ? 'Uploading & Encrypting...' : 'Upload'}
          </button>
        </form>

        {shareableUrl && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              File uploaded successfully! 🔒
            </p>
            <p className="text-xs text-gray-600 mb-2">
              Expires: {expiresAt}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareableUrl}
                readOnly
                className="flex-1 p-2 text-sm border border-gray-300 rounded"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
