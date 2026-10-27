'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarClock, LogOut, ShieldCheck, User } from 'lucide-react';
import { Profile, NotificationItem } from '@/lib/types';
import { logout } from '@/lib/actions/auth';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  profile: Profile | null;
  notifications: NotificationItem[];
}

export const Navbar: React.FC<NavbarProps> = ({ profile, notifications }) => {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Browse Resources', href: '/' },
    { label: 'My Bookings', href: '/my-bookings' },
    ...(profile?.role === 'admin' ? [{ label: 'Admin Panel', href: '/admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-indigo-600">
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-sm">
                <CalendarClock className="w-5 h-5" />
              </div>
              <span className="tracking-tight text-gray-900">
                Slot<span className="text-indigo-600">Sync</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {profile && <NotificationBell notifications={notifications} />}

            {profile ? (
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-900 leading-tight">
                    {profile.full_name}
                  </span>
                  <span className="text-[10px] text-gray-500 capitalize flex items-center justify-end gap-1">
                    {profile.role === 'admin' ? (
                      <span className="text-indigo-600 font-medium inline-flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      'Student'
                    )}
                  </span>
                </div>

                <form action={logout}>
                  <button
                    type="submit"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex border-t border-gray-100 py-2 space-x-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
