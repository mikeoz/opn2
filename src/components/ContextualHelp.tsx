import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  X, 
  Lightbulb, 
  Users, 
  CreditCard, 
  TreePine,
  QrCode,
  Search,
  Info,
  Gift,
  Star,
  ArrowRight
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HelpTip {
  id: string;
  title: string;
  description: string;
  benefit?: string;
  demoNote?: string;
  route: string;
  icon: React.ComponentType<any>;
  priority: 'high' | 'medium' | 'low';
}

const CONTEXTUAL_TIPS: Record<string, HelpTip[]> = {
  '/dashboard': [
    {
      id: 'dashboard-start',
      title: 'Start Building Your Network',
      description: 'Create your first card to begin connecting with your community.',
      benefit: 'People with complete profiles receive 3x more meaningful connections.',
      route: '/card-catalog',
      icon: CreditCard,
      priority: 'high',
      demoNote: 'Demo Mode shows sample engagement metrics.'
    },
    {
      id: 'dashboard-family',
      title: 'Add Your Family',
      description: 'Set up family units to unlock group benefits and strengthen bonds.',
      benefit: 'Families who connect on Opn.li report 40% more shared activities.',
      route: '/family-management',
      icon: TreePine,
      priority: 'medium'
    }
  ],
  '/my-cards': [
    {
      id: 'cards-visibility',
      title: 'Make Your Cards Discoverable',
      description: 'Ensure your cards have rich descriptions to attract the right connections.',
      benefit: 'Well-described cards get 5x more views from relevant community members.',
      route: '/card-catalog',
      icon: Star,
      priority: 'high'
    }
  ],
  '/directory': [
    {
      id: 'directory-search',
      title: 'Use Smart Filtering',
      description: 'Filter by interests, location, or services to find exactly who you need.',
      benefit: 'Targeted searches lead to more successful collaborations and friendships.',
      route: '/directory',
      icon: Search,
      priority: 'medium'
    }
  ],
  '/family-management': [
    {
      id: 'family-invite',
      title: 'Invite Family Members',
      description: 'Send invitations to bring your family into your Opn.li network.',
      benefit: 'Connected families save an average of $200/month through shared resources.',
      route: '/family-management',
      icon: Users,
      priority: 'high',
      demoNote: 'Demo Mode simulates family invitations with sample profiles.'
    }
  ],
  '/merchant-hub': [
    {
      id: 'merchant-loyalty',
      title: 'Show Your Loyalty',
      description: 'Scan merchant QR codes to demonstrate your commitment to local businesses.',
      benefit: 'Loyal customers receive exclusive offers and priority service.',
      route: '/merchant-hub',
      icon: QrCode,
      priority: 'high',
      demoNote: 'Demo Mode uses sample merchant data and simulated rewards.'
    }
  ]
};

interface ContextualHelpProps {
  currentRoute: string;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({ currentRoute }) => {
  const navigate = useNavigate();
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem('dismissed-tips') || '[]');
    setDismissedTips(new Set(dismissed));
  }, []);

  const tips = CONTEXTUAL_TIPS[currentRoute] || [];
  const availableTips = tips.filter(tip => !dismissedTips.has(tip.id));
  
  if (availableTips.length === 0) return null;

  const currentTip = availableTips[currentTipIndex % availableTips.length];

  const dismissTip = (tipId: string) => {
    const newDismissed = new Set(dismissedTips);
    newDismissed.add(tipId);
    setDismissedTips(newDismissed);
    localStorage.setItem('dismissed-tips', JSON.stringify([...newDismissed]));
  };

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % availableTips.length);
  };

  const IconComponent = currentTip.icon;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-40 animate-slide-up">
      <Card className="border-2 border-benefit/20 bg-background/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-benefit/10 rounded-full flex items-center justify-center">
                <IconComponent className="h-4 w-4 text-benefit" />
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{currentTip.title}</h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      currentTip.priority === 'high' 
                        ? 'border-benefit text-benefit' 
                        : 'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {currentTip.priority}
                  </Badge>
                </div>
                
                <button
                  onClick={() => dismissTip(currentTip.id)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {currentTip.description}
              </p>
              
              {currentTip.benefit && (
                <div className="bg-benefit/5 border border-benefit/20 rounded p-2">
                  <div className="flex items-start gap-1">
                    <Gift className="h-3 w-3 text-benefit flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-benefit">{currentTip.benefit}</p>
                  </div>
                </div>
              )}

              {currentTip.demoNote && (
                <div className="flex items-start gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">
                          <strong>Demo Mode:</strong> {currentTip.demoNote}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-xs text-muted-foreground">Demo Mode Active</p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-1">
                <Button
                  size="sm"
                  onClick={() => navigate(currentTip.route)}
                  className="h-7 text-xs bg-benefit hover:bg-benefit/90"
                >
                  Take Action
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
                
                {availableTips.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextTip}
                    className="h-7 text-xs"
                  >
                    Next Tip
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};