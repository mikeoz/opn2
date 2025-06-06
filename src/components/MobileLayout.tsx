
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Users, CreditCard, Plus, Share2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar - 10% of screen */}
      <header className="h-[10vh] bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between">
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
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Body - 80% of screen */}
      <main className="flex-1 h-[80vh] overflow-y-auto">
        {children}
      </main>

      {/* Bottom Bar - 10% of screen */}
      <nav className="h-[10vh] bg-card border-t border-border flex items-center justify-around px-2">
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
          disabled
        >
          <Share2 className="h-5 w-5" />
          Share
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-col h-full gap-1 text-xs"
          disabled
        >
          <Eye className="h-5 w-5" />
          Views
        </Button>
      </nav>
    </div>
  );
};

export default MobileLayout;
