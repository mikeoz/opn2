import React from 'react';
import { Bell, Eye, Heart, Share, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationSystem, CardInvitationNotification } from '@/hooks/useNotificationSystem';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    loading, 
    markAsRead,
    getUnreadCount,
    getCreatedNotifications,
    getReceivedNotifications 
  } = useNotificationSystem();

  const getNotificationIcon = (type: CardInvitationNotification['notification_type']) => {
    switch (type) {
      case 'delivered':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'opened':
        return <Eye className="h-4 w-4 text-green-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'modified':
        return <Heart className="h-4 w-4 text-purple-500" />;
      case 'shared_back':
        return <Share className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification: CardInvitationNotification) => {
    const { notification_type, notification_data } = notification;
    const cardName = notification_data.card_name || 'Card';
    
    switch (notification_type) {
      case 'delivered':
        return `Invitation for "${cardName}" was delivered`;
      case 'opened':
        return `Invitation for "${cardName}" was opened`;
      case 'accepted':
        return `"${cardName}" invitation was accepted and added to repository`;
      case 'modified':
        return `"${cardName}" was customized by recipient`;
      case 'shared_back':
        return `"${cardName}" was shared back with you`;
      default:
        return 'Card activity notification';
    }
  };

  const getNotificationColor = (type: CardInvitationNotification['notification_type']) => {
    switch (type) {
      case 'delivered': return 'bg-blue-50 border-l-blue-400';
      case 'opened': return 'bg-green-50 border-l-green-400';
      case 'accepted': return 'bg-emerald-50 border-l-emerald-400';
      case 'modified': return 'bg-purple-50 border-l-purple-400';
      case 'shared_back': return 'bg-orange-50 border-l-orange-400';
      default: return 'bg-gray-50 border-l-gray-400';
    }
  };

  const createdNotifications = getCreatedNotifications();
  const receivedNotifications = getReceivedNotifications();
  const unreadCount = getUnreadCount();

  if (loading) {
    return <div className="p-4">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Notification Center</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share className="h-4 w-4" />
              Sent Invitations
              <Badge variant="outline">{createdNotifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {createdNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 mb-2 border-l-4 rounded-r-md ${getNotificationColor(notification.notification_type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.notification_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                      {notification.notification_data.recipient_email && (
                        <p className="text-xs text-gray-600 mt-1">
                          To: {notification.notification_data.recipient_email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {createdNotifications.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  No sent invitations yet
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Received Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Received Notifications
              <Badge variant="outline">{receivedNotifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {receivedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 mb-2 border-l-4 rounded-r-md ${getNotificationColor(notification.notification_type)} ${!notification.read_at ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.notification_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                      {!notification.read_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-6 px-2 text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                    {!notification.read_at && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
              {receivedNotifications.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  No notifications received
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">
            Card sharing notifications will appear here when you send or receive invitations.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;