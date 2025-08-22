
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Users, CreditCard, Plus, Share2, Eye, User, Settings, HelpCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { OnboardingTutorial } from './OnboardingTutorial';
import { ContextualHelp } from './ContextualHelp';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboarding-dismissed');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 2000);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Opn.li</h1>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="h-touch-target w-touch-target p-0 touch-manipulation"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOnboarding(true)}
              className="h-touch-target w-touch-target p-0 touch-manipulation"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="h-touch-target w-touch-target p-0 touch-manipulation"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-touch-target w-touch-target p-0 touch-manipulation"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-around p-2">
          <Link
            to="/directory"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-h-touch-target touch-manipulation ${
              location.pathname === '/directory'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Directory</span>
          </Link>

          <Link
            to="/my-cards"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-h-touch-target touch-manipulation ${
              location.pathname === '/my-cards'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-xs">My Cards</span>
          </Link>

          <Link
            to="/create-card"
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-benefit text-benefit-foreground min-h-touch-target touch-manipulation animate-pulse-glow"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">Add</span>
          </Link>

          <Link
            to="/family-management"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-h-touch-target touch-manipulation ${
              location.pathname === '/family-management'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Share2 className="h-5 w-5" />
            <span className="text-xs">Family</span>
          </Link>

          <Link
            to="/merchant-hub"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-h-touch-target touch-manipulation ${
              location.pathname === '/merchant-hub'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs">Loyal</span>
          </Link>
        </div>
      </nav>

      {/* Enhanced Features */}
      <PWAInstallPrompt />
      <OnboardingTutorial
        isVisible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        currentRoute={location.pathname}
      />
      <ContextualHelp currentRoute={location.pathname} />
    </div>
  );
};

export default MobileLayout;
