import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BeforeInstallPromptEvent extends Event {
  platforms: string[];
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds or on second visit
      const visits = parseInt(localStorage.getItem('pwa-visits') || '0') + 1;
      localStorage.setItem('pwa-visits', visits.toString());
      
      if (visits >= 2) {
        setTimeout(() => setIsVisible(true), 30000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      
      toast({
        title: "App Installed Successfully! 🎉",
        description: "Opn.li is now available on your home screen for quick access.",
        duration: 5000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast({
          title: "Installing App...",
          description: "Opn.li will be added to your home screen shortly.",
        });
      }
      
      setDeferredPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('Install prompt failed:', error);
      toast({
        title: "Installation Failed",
        description: "Please try installing manually through your browser menu.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  if (isInstalled || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <Card className="border-2 border-benefit bg-background/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-benefit/10 rounded-full flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-benefit" />
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Install Opn.li App</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">
                      <strong>Demo Mode:</strong> App installation works fully. 
                      In Alpha Testing, you'll get push notifications and 
                      enhanced offline sync capabilities.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Get instant access, offline features, and notifications. 
                Join your community wherever you are.
              </p>
              
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="h-8 text-xs bg-benefit hover:bg-benefit/90"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install Now
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 text-xs"
                >
                  Later
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};