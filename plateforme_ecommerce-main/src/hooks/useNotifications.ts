import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Notification } from '../types';
import { useApp } from '../context/AppContext';

export function useNotifications() {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/api/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      // Quiet warning for transient network or polling errors
      console.warn('Could not fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    
    if (user) {
      const intervalId = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
      return () => clearInterval(intervalId);
    }
  }, [fetchNotifications, user]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await api.put(`/api/notifications/${id}/read`, {}, { timeout: 5000 });
    } catch (error) {
      console.warn('Failed to mark as read on server, updated locally:', error);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.put('/api/notifications/read-all', {}, { timeout: 5000 });
    } catch (error) {
      console.warn('Failed to mark all as read on server, updated locally:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/api/notifications/${id}`, { timeout: 5000 });
    } catch (error) {
      console.warn('Failed to delete notification on server, removed locally:', error);
    }
  };

  const deleteAllNotifications = async () => {
    // Optimistic UI update
    setNotifications([]);
    try {
      await api.delete('/api/notifications/all', { timeout: 5000 });
    } catch (error) {
      console.warn('Failed to delete all notifications on server, cleared locally:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch: fetchNotifications
  };
}
