
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, LogOut, Users, CreditCard, Plus, Share2, Eye, User, Settings, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
// import { useProfile } from '@/hooks/useProfile';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  // const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Top Bar - Fixed at top */}
      <header className="h-16 bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex-1">
          <h1 className="text-lg font-bold">Opnli Community Directory</h1>
          <p className="text-sm opacity-90">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/20"
            asChild
          >
            <Link to="/dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/20"
            asChild
            title="Settings"
          >
            <Link to="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/20"
            asChild
          >
            <Link to="/profile">
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/20"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Body - Scrollable content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Bar - Fixed at bottom */}
      <nav className="h-16 bg-card border-t border-border flex items-center justify-around px-2 flex-shrink-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-1 text-xs"
          asChild
        >
          <Link to="/directory">
            <Users className="h-5 w-5" />
            Directory
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-1 text-xs"
          asChild
        >
          <Link to="/cards">
            <CreditCard className="h-5 w-5" />
            My Cards
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-1 text-xs bg-accent text-accent-foreground hover:bg-accent/80"
          asChild
        >
          <Link to="/cards">
            <Plus className="h-5 w-5" />
            Add
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-1 text-xs"
          asChild
        >
          <Link to="/cards">
            <Share2 className="h-5 w-5" />
            Share
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-1 text-xs"
          asChild
        >
          <Link to="/cards">
            <Eye className="h-5 w-5" />
            Views
          </Link>
        </Button>
      </nav>
    </div>
  );
};

export default MobileLayout;
