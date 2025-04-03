'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Building2,
  CheckSquare,
  LogOut,
  ChevronLeft,
  Menu,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      router.push('/');
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    router.push('/');
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />
    },
    {
      name: 'NGO Accounts',
      href: '/ngo-accounts',
      icon: <Building2 size={20} />
    },
    {
      name: 'NGO Approval',
      href: '/ngo-approval',
      icon: <CheckSquare size={20} />
    },
    {
      name: 'Volunteer Accounts',
      href: '/volunteer-accounts',
      icon: <Users size={20} />
    },
    {
      name: 'Events Management',
      href: '/events-management',
      icon: <CalendarCheck size={20} />
    }
  ];

  const sidebarClasses = cn(
    'h-screen bg-white dark:bg-gray-900 flex flex-col transition-all duration-300 border-r border-gray-200 dark:border-gray-800 shadow-sm',
    {
      'w-64': !collapsed && !isMobile,
      'w-20': collapsed && !isMobile,
      'fixed inset-y-0 left-0 z-50 w-64': isMobile,
      'translate-x-0': mobileOpen && isMobile,
      '-translate-x-full': !mobileOpen && isMobile
    }
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white shadow-md"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileSidebar}
        />
      )}

      <div className={sidebarClasses}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            {!collapsed && <h1 className="text-xl font-bold">VolunTrek Admin</h1>}
          </div>
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft
                size={20}
                className={cn('transition-transform', {
                  'rotate-180': collapsed
                })}
              />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-3 rounded-md transition-colors',
                  {
                    'bg-gray-100 dark:bg-gray-800 text-primary': pathname === item.href,
                    'hover:bg-gray-100 dark:hover:bg-gray-800': pathname !== item.href,
                    'justify-center': collapsed && !isMobile,
                    'justify-start space-x-3': !collapsed || isMobile
                  }
                )}
              >
                <span>{item.icon}</span>
                {(!collapsed || isMobile) && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2">
                <User size={20} />
              </div>
              {(!collapsed || isMobile) && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{username}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Admin</span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}