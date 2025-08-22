import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  CreditCard, 
  Share2, 
  TreePine, 
  QrCode,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Info,
  Gift,
  Store,
  Heart,
  Star,
  X
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  benefit: string;
  icon: React.ComponentType<any>;
  route?: string;
  demoNote?: string;
  completed?: boolean;
}

interface OnboardingTutorialProps {
  isVisible: boolean;
  onClose: () => void;
  currentRoute?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Opn.li',
    description: 'Your community connection platform where relationships create real value.',
    benefit: 'Connect authentically and discover meaningful opportunities through your community.',
    icon: Heart,
  },
  {
    id: 'family-setup',
    title: 'Build Your Family Network',
    description: 'Create and manage family units to represent your closest relationships.',
    benefit: 'Strengthen family bonds and unlock group benefits that benefit everyone.',
    icon: TreePine,
    route: '/family-management',
    demoNote: 'Demo Mode uses placeholder family data. In Alpha Testing, you\'ll invite real family members.',
  },
  {
    id: 'create-cards',
    title: 'Share Your Story',
    description: 'Create personal cards that showcase your passions, places, and purposes.',
    benefit: 'Be discovered by like-minded community members and unlock new opportunities.',
    icon: CreditCard,
    route: '/create-card',
    demoNote: 'Demo Mode cards are visible to sample users. In Alpha Testing, your real community will see them.',
  },
  {
    id: 'directory',
    title: 'Explore Your Community',
    description: 'Browse the directory to discover neighbors, shared interests, and local connections.',
    benefit: 'Find collaboration partners, trusted services, and new friendships nearby.',
    icon: Users,
    route: '/directory',
    demoNote: 'Demo Mode shows sample community members. Alpha Testing will connect you to real neighbors.',
  },
  {
    id: 'merchant-loyalty',
    title: 'Become Opn.li Loyal',
    description: 'Scan QR codes from local merchants to show your commitment and earn exclusive benefits.',
    benefit: 'Get special offers, priority service, and help local businesses thrive.',
    icon: QrCode,
    route: '/merchant-hub',
    demoNote: 'Demo Mode simulates merchant interactions. In Alpha Testing, partner with real local businesses.',
  },
  {
    id: 'share-value',
    title: 'Share the Benefits',
    description: 'Invite others to join and multiply the value for everyone in your community.',
    benefit: 'The more people participate, the more opportunities and benefits everyone receives.',
    icon: Share2,
    demoNote: 'Demo Mode tracks simulated referrals. In Alpha Testing, real invitations expand your network.',
  }
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isVisible,
  onClose,
  currentRoute
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem('onboarding-completed') || '[]');
    setCompletedSteps(new Set(completed));
  }, []);

  const markStepCompleted = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    localStorage.setItem('onboarding-completed', JSON.stringify([...newCompleted]));
  };

  const progress = (completedSteps.size / TUTORIAL_STEPS.length) * 100;
  const currentStepData = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    markStepCompleted(currentStepData.id);
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('onboarding-dismissed', 'true');
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding-dismissed', 'true');
    onClose();
  };

  if (!isVisible) return null;

  const IconComponent = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2 border-benefit/20 animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </Badge>
            <button
              onClick={handleSkip}
              className="p-1 hover:bg-muted rounded text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="space-y-2">
            <div className="w-16 h-16 bg-benefit/10 rounded-full flex items-center justify-center mx-auto">
              <IconComponent className="h-8 w-8 text-benefit" />
            </div>
            
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {currentStepData.description}
            </p>
            
            {/* Benefit highlight */}
            <div className="bg-benefit/5 border border-benefit/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Gift className="h-4 w-4 text-benefit flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-benefit mb-1">Community Benefit</p>
                  <p className="text-xs text-muted-foreground">
                    {currentStepData.benefit}
                  </p>
                </div>
              </div>
            </div>

            {/* Demo mode note */}
            {currentStepData.demoNote && (
              <div className="bg-muted/30 border border-muted rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Demo Mode</p>
                    <p className="text-xs text-muted-foreground">
                      {currentStepData.demoNote}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {TUTORIAL_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-benefit'
                      : index < currentStep || completedSteps.has(TUTORIAL_STEPS[index].id)
                      ? 'bg-benefit/50'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button
              size="sm"
              onClick={handleNext}
              className="flex items-center gap-1 bg-benefit hover:bg-benefit/90"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>

          {/* Quick action */}
          {currentStepData.route && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  markStepCompleted(currentStepData.id);
                  window.location.href = currentStepData.route!;
                }}
                className="w-full text-xs text-benefit hover:bg-benefit/5"
              >
                Try This Feature Now →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};