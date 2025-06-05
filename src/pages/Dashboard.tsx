
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, Share2, Plus, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  // Mock data for now - will be replaced with real data later
  const stats = {
    myCARDs: 5,
    cardsShared: 12,
    participantCards: 8
  };

  console.log('Dashboard - User:', user?.email, 'isAdmin:', isAdmin, 'roleLoading:', roleLoading);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Opnli Community Directory</h1>
            <p className="text-gray-600">
              Welcome back, {user?.email}
              {isAdmin && <span className="ml-2 text-green-600 font-semibold">(Administrator)</span>}
            </p>
          </div>
          <Button onClick={signOut} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My CARDs</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myCARDs}</div>
              <p className="text-xs text-muted-foreground">Cards you've created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cards Shared</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cardsShared}</div>
              <p className="text-xs text-muted-foreground">Total shares made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participant Cards</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.participantCards}</div>
              <p className="text-xs text-muted-foreground">Network connections</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button asChild className="h-20 flex-col">
            <Link to="/cards">
              <CreditCard className="h-6 w-6 mb-2" />
              My Cards
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/cards">
              <Plus className="h-6 w-6 mb-2" />
              Create Card
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/cards">
              <Share2 className="h-6 w-6 mb-2" />
              Share Card
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link to="/directory">
              <Users className="h-6 w-6 mb-2" />
              Directory
            </Link>
          </Button>
        </div>

        {/* Admin Section - Only show if user is admin */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Administrator Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button asChild className="h-20 flex-col bg-green-600 hover:bg-green-700">
                <Link to="/admin/cards">
                  <Settings className="h-6 w-6 mb-2" />
                  Manage AdminCARDs
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">Contact Card shared with john@example.com</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">New participant card received from Jane Smith</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">Professional Services Card created</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
