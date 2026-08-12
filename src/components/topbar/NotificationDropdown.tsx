"use client";

import Link from "next/link";
import {
  Check,
  ChevronRight,
  Inbox,
  AlertTriangle,
  Sparkles,
  Receipt,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "warning" | "insight" | "transaction";
}

interface NotificationDropdownProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

export default function NotificationDropdown({
  isOpen,
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onMarkAsRead,
  onClose,
}: NotificationDropdownProps) {
  if (!isOpen) return null;

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "warning":
        return (
          <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case "insight":
        return (
          <div className="h-8 w-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Sparkles size={15} />
          </div>
        );
      case "transaction":
        return (
          <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Receipt size={15} />
          </div>
        );
    }
  };

  return (
    <div className="absolute top-full -right-12 sm:right-0 mt-2 w-75 sm:w-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 font-medium transition cursor-pointer flex items-center gap-1"
          >
            <Check size={13} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Inbox size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => onMarkAsRead(item.id)}
              className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                !item.read ? "bg-teal-50/20 dark:bg-teal-950/20" : ""
              }`}
            >
              {getNotificationIcon(item.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
              </div>
              {!item.read && (
                <span className="h-1.5 w-1.5 bg-teal-500 rounded-full shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition"
        >
          View all notifications
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
