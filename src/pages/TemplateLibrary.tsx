import MobileLayout from '@/components/MobileLayout';
import StandardTemplateLibrary from '@/components/StandardTemplateLibrary';
import NotificationCenter from '@/components/NotificationCenter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Library, Bell } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Badge } from '@/components/ui/badge';

export default function TemplateLibrary() {
  const { getUnreadCount } = useNotificationSystem();
  const unreadCount = getUnreadCount();

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Template Library
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="catalog">
            <StandardTemplateLibrary />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}