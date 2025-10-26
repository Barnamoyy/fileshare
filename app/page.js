'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Background from "@/assets/background.jpg";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/upload');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Image
        src={Background}
        alt="background"
        className="w-full h-full absolute top-0 left-0 z-10 object-cover"
      />
      <div className="relative z-20 w-full max-w-md p-8 bg-white rounded-lg shadow-xl text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Share Files Securely
        </h1>
        <p className="text-base text-gray-600 mb-8">
          Your simple, serverless platform for sharing files with ease and confidence.
        </p>
        <Button
          onClick={() => signIn('google')}
          className="w-full py-3 rounded-md shadow-lg"
        >
          Sign Up with Google
        </Button>
        <p className="text-sm text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} FileShare. All rights reserved.
        </p>
      </div>
    </div>
  );
}