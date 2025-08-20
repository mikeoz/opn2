import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CardInvitationNotification {
  id: string;
  invitation_id: string;
  recipient_id?: string;
  creator_id: string;
  notification_type: 'delivered' | 'opened' | 'accepted' | 'modified' | 'shared_back';
  notification_data: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export const useNotificationSystem = () => {
  const [notifications, setNotifications] = useState<CardInvitationNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_invitation_notifications')
        .select('*')
        .or(`creator_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []).map(item => ({
        ...item,
        notification_type: item.notification_type as CardInvitationNotification['notification_type'],
        notification_data: item.notification_data as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (
    invitationId: string,
    creatorId: string,
    recipientId: string | null,
    notificationType: CardInvitationNotification['notification_type'],
    notificationData: Record<string, any> = {}
  ) => {
    try {
      const { error } = await supabase
        .from('card_invitation_notifications')
        .insert({
          invitation_id: invitationId,
          creator_id: creatorId,
          recipient_id: recipientId,
          notification_type: notificationType,
          notification_data: notificationData
        });

      if (error) throw error;
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('card_invitation_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read_at && n.recipient_id === user?.id).length;
  };

  const getNotificationsByType = (type: CardInvitationNotification['notification_type']) => {
    return notifications.filter(n => n.notification_type === type);
  };

  const getCreatedNotifications = () => {
    return notifications.filter(n => n.creator_id === user?.id);
  };

  const getReceivedNotifications = () => {
    return notifications.filter(n => n.recipient_id === user?.id);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return {
    notifications,
    loading,
    createNotification,
    markAsRead,
    getUnreadCount,
    getNotificationsByType,
    getCreatedNotifications,
    getReceivedNotifications,
    refetch: fetchNotifications
  };
};