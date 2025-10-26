'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import Background from "@/assets/background.jpg";
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [shareableUrl, setShareableUrl] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [expiresAt, setExpiresAt] = useState('');
  const router = useRouter(); 

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      toast.success(`File selected: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      toast.success(`File selected: ${e.target.files[0].name}`);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    const owner = session?.user.name;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expiryHours', expiryHours.toString());
      formData.append('owner', owner);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.shareableUrl) {
        setShareableUrl(data.shareableUrl);
        setExpiresAt(new Date(data.expiresAt).toLocaleString());
        toast.success('File uploaded and encrypted successfully!');
      } else {
        toast.error(data.error || 'Error uploading file.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    toast.success('Link copied to clipboard!');
  };

  if (status === "loading") {
    return <p className="text-black">Loading...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Image src={Background} alt='background' className='w-full h-full absolute top-0 left-0 z-10'/>
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md z-50">
        <h1 className="text-lg font-semibold mb-4 text-black">Secure File Upload</h1>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-black">Drop the files here ...</p>
            ) : (
              <p className="text-black">Drag 'n' drop some files here, or click to select files</p>
            )}
            {file && <p className="mt-2 text-sm text-black">Selected file: {file.name}</p>}
          </div>

          <div className="flex items-center justify-center my-4">
            <span className="text-black">OR</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Manual File Upload
            </label>
            <Input
              type="file"
              onChange={handleFileChange}
              className="w-full text-black"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Expiry Time (hours)
            </label>
            <Input
              type="number"
              min="1"
              max="168"
              value={expiryHours}
              onChange={(e) => setExpiryHours(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>
          
          <Button
            type="submit"
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2 text-black">
                <span>Uploading...</span>
              </div>
            ) : (
              'Upload'
            )}
          </Button>
          <Button onClick={() => signOut({ callbackUrl: "/" })} className="w-full text-white">Signout</Button>
        </form>

        {shareableUrl && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              File uploaded successfully!
            </p>
            <p className="text-sm mb-2 text-black">
              Expires: {expiresAt}
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={shareableUrl}
                readOnly
                className="flex-1 p-2 text-sm border border-gray-300 rounded text-black"
              />
              <Button
                onClick={copyToClipboard}
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
