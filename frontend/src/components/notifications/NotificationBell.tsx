// src/components/notifications/NotificationBell.tsx

import { useState, useEffect } from 'react';
// import { useAuthStore } from '../../store/authStore';

interface Notification {
  id: number;
  type: 'task_assigned' | 'task_completed' | 'task_updated' | 'mention';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  taskId?: number;
}

const NotificationBell = () => {
//   const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const fetchNotifications = async () => {
    // TODO: Implement backend endpoint for notifications
    // For now, using mock data
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new task: "Website Redesign"',
        timestamp: new Date().toISOString(),
        read: false,
        taskId: 123,
      },
      {
        id: 2,
        type: 'task_completed',
        title: 'Task Completed',
        message: 'John Doe completed task: "API Integration"',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        taskId: 122,
      },
    ];
    
    setNotifications(mockNotifications);
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned': return '📋';
      case 'task_completed': return '✅';
      case 'task_updated': return '🔄';
      case 'mention': return '🔔';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;