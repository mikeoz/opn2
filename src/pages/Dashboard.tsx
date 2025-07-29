
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Clock, Users, MapPin, Heart, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import MobileLayout from '@/components/MobileLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Mock data for the four dimensions
  const peopleData = [
    { name: "Sarah Johnson", status: "Online", lastInteraction: "2 hours ago" },
    { name: "Mike Chen", status: "Away", lastInteraction: "1 day ago" },
    { name: "Emma Davis", status: "Online", lastInteraction: "30 mins ago" },
    { name: "Tom Wilson", status: "Offline", lastInteraction: "3 days ago" },
  ];

  const placesData = [
    { name: "Downtown Coffee Shop", type: "Business", visits: "Weekly" },
    { name: "City Library", type: "Public", visits: "Monthly" },
    { name: "Tech Workspace", type: "Office", visits: "Daily" },
    { name: "Community Center", type: "Social", visits: "Bi-weekly" },
  ];

  const passionsData = [
    { topic: "#Photography", connections: 12, activity: "High" },
    { topic: "#Hiking", connections: 8, activity: "Medium" },
    { topic: "#Cooking", connections: 15, activity: "High" },
    { topic: "#Reading", connections: 6, activity: "Low" },
  ];

  const purposesData = [
    { topic: "#CareerDevelopment", connections: 9, priority: "High" },
    { topic: "#HealthWellness", connections: 7, priority: "Medium" },
    { topic: "#CommunityService", connections: 5, priority: "High" },
    { topic: "#FinancialPlanning", connections: 3, priority: "Low" },
  ];

  const recentActivity = [
    { action: "Contact Card shared with john@example.com", time: "2 hours ago", type: "share" },
    { action: "New participant card received from Jane Smith", time: "1 day ago", type: "receive" },
    { action: "Professional Services Card created", time: "3 days ago", type: "create" },
    { action: "Updated Address Information card", time: "1 week ago", type: "update" },
    { action: "Connected with Mike Chen at Tech Workspace", time: "1 week ago", type: "connect" },
  ];

  console.log('Dashboard - User:', user?.email, 'isAdmin:', isAdmin, 'roleLoading:', roleLoading);

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'share' ? 'bg-primary' :
                    activity.type === 'receive' ? 'bg-accent' :
                    activity.type === 'create' ? 'bg-green-500' :
                    activity.type === 'update' ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* People */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {peopleData.map((person, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{person.lastInteraction}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    person.status === 'Online' ? 'bg-green-100 text-green-800' :
                    person.status === 'Away' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {person.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Places */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              Places
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {placesData.map((place, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{place.name}</p>
                    <p className="text-xs text-muted-foreground">{place.type}</p>
                  </div>
                  <span className="text-xs text-primary font-medium">{place.visits}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Passions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Passions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {passionsData.map((passion, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{passion.topic}</p>
                    <p className="text-xs text-muted-foreground">{passion.connections} connections</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    passion.activity === 'High' ? 'bg-red-100 text-red-800' :
                    passion.activity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {passion.activity}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purposes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Purposes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {purposesData.map((purpose, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{purpose.topic}</p>
                    <p className="text-xs text-muted-foreground">{purpose.connections} connections</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    purpose.priority === 'High' ? 'bg-green-100 text-green-800' :
                    purpose.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {purpose.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Section - At bottom of scroll */}
        {isAdmin && (
          <div className="pt-6 border-t border-border">
            <h2 className="text-lg font-semibold text-muted-foreground mb-4">Administrator Tools</h2>
            <div className="space-y-2">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link to="/admin/cards">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage AdminCARDs
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/bulk-import">
                  <Settings className="h-4 w-4 mr-2" />
                  Bulk Import Manager
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
