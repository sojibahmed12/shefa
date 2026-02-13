'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Bell, CheckCheck, Calendar, CreditCard, Video,
  UserCheck, FileText, Star, AlertCircle, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!session) { router.push('/auth/login'); return; }
    fetchNotifications();
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) setNotifications(data.data.notifications || []);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action: 'read' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read-all' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success('All marked as read');
      }
    } catch { toast.error('Failed'); }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'PAYMENT': return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'VIDEO': return <Video className="h-4 w-4 text-violet-500" />;
      case 'APPROVAL': return <UserCheck className="h-4 w-4 text-shefa-500" />;
      case 'PRESCRIPTION': return <FileText className="h-4 w-4 text-amber-500" />;
      case 'REVIEW': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-shefa-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">Notifications</h1>
          <p className="mt-1 text-sm text-shefa-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-ghost text-xs">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? 'bg-shefa-600 text-white' : 'bg-shefa-50 text-shefa-600 hover:bg-shefa-100'
            }`}>
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-shefa-400">
            <Bell className="h-12 w-12 mb-3" />
            <p>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-shefa-50">
            {filtered.map(notification => (
              <div
                key={notification._id}
                onClick={() => {
                  if (!notification.isRead) markAsRead(notification._id);
                  if (notification.link) router.push(notification.link);
                }}
                className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-shefa-50/50 ${
                  !notification.isRead ? 'bg-shefa-50/30' : ''
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  !notification.isRead ? 'bg-shefa-100' : 'bg-shefa-50'
                }`}>
                  {typeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-shefa-900' : 'text-shefa-700'}`}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-shefa-500" />
                    )}
                  </div>
                  <p className="text-xs text-shefa-500 mt-0.5">{notification.message}</p>
                  <p className="text-[10px] text-shefa-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
