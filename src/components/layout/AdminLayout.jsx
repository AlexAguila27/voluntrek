'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username) {
      router.push('/');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return null; // Don't render anything until authentication check is complete
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}