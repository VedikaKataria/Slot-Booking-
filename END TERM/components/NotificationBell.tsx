'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Sparkles } from 'lucide-react';
import { NotificationItem } from '@/lib/types';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications';

interface NotificationBellProps {
  notifications: NotificationItem[];
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ notifications }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;

  /**
   * Toggles dropdown and marks all unread notifications as read on open
   */
  const handleToggle = async () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    // Prompt requirement: Mark as read on open
    if (willOpen && unreadCount > 0) {
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await markAllNotificationsAsRead();
    }
  };

  const handleMarkIndividualRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationAsRead(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Notifications</span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">
              Auto-marked read
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-700">No notifications yet</p>
                <p>You will be alerted here when a waitlisted slot opens up!</p>
              </div>
            ) : (
              items.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && handleMarkIndividualRead(notif.id)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer ${
                    notif.is_read
                      ? 'bg-white text-gray-600 hover:bg-gray-50'
                      : 'bg-indigo-50/40 text-gray-900 font-medium hover:bg-indigo-50/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        notif.is_read ? 'bg-gray-300' : 'bg-indigo-600 animate-pulse'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        {new Date(notif.created_at || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
