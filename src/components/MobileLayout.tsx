
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, LogOut, CreditCard, BookUser, UsersRound, Rss, Sparkles, User, Settings, Upload } from 'lucide-react';
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
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/20"
                asChild
                title="Admin Cards"
              >
                <Link to="/admin/cards">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/20"
                asChild
                title="Bulk Import"
              >
                <Link to="/admin/bulk-import">
                  <Upload className="h-5 w-5" />
                </Link>
              </Button>
            </>
          )}
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

      {/* Bottom Bar - Fixed at bottom - 5 Main Navigation Icons */}
      <nav className="h-20 bg-card border-t border-border flex items-center justify-around px-1 flex-shrink-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-0.5 text-xs flex-1 hover:bg-muted"
          asChild
        >
          <Link to="/cards">
            <CreditCard className="h-6 w-6" />
            <span className="text-[10px]">Profile</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-0.5 text-xs flex-1 hover:bg-muted"
          asChild
        >
          <Link to="/directory">
            <BookUser className="h-6 w-6" />
            <span className="text-[10px]">Catalog</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-0.5 text-xs flex-1 hover:bg-muted"
          asChild
        >
          <Link to="/groups">
            <UsersRound className="h-6 w-6" />
            <span className="text-[10px]">Groups</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-0.5 text-xs flex-1 hover:bg-muted"
          asChild
        >
          <Link to="/feeds">
            <Rss className="h-6 w-6" />
            <span className="text-[10px]">Feeds</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-0.5 text-xs flex-1 hover:bg-muted"
          asChild
        >
          <Link to="/peeps">
            <Sparkles className="h-6 w-6" />
            <span className="text-[10px]">Peeps</span>
          </Link>
        </Button>
      </nav>
    </div>
  );
};

export default MobileLayout;
