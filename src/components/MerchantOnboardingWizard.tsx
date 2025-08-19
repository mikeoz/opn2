import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  Upload, 
  QrCode, 
  Users, 
  Settings,
  Sparkles
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import OrganizationBrandingSettings from './OrganizationBrandingSettings';
import OrganizationManagement from './OrganizationManagement';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  component?: React.ComponentType;
}

const MerchantOnboardingWizard = () => {
  const { profile } = useProfile();
  const { merchantProfile, isMerchant } = useMerchantProfile();
  const [currentStep, setCurrentStep] = useState(0);

  // Define onboarding steps
  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Welcome to Merchant Services',
      description: 'Get started with your organization account',
      icon: Sparkles,
      completed: true,
    },
    {
      id: 'branding',
      title: 'Set Up Your Branding',
      description: 'Upload your logo and customize your organization appearance',
      icon: Upload,
      completed: !!profile?.logo_url && !!profile?.organization_name,
      component: OrganizationBrandingSettings,
    },
    {
      id: 'team',
      title: 'Manage Your Team',
      description: 'Invite team members and set permissions',
      icon: Users,
      completed: false, // We could check if they have team members
      component: OrganizationManagement,
    },
    {
      id: 'qr-setup',
      title: 'QR Code Setup',
      description: 'Configure QR codes for customer engagement',
      icon: QrCode,
      completed: false, // We could check if they have QR codes set up
    },
    {
      id: 'complete',
      title: 'Setup Complete',
      description: 'Your merchant account is ready to go!',
      icon: CheckCircle,
      completed: false,
    },
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    if (step.component) {
      const Component = step.component;
      return <Component />;
    }

    // Default content for steps without custom components
    switch (step.id) {
      case 'welcome':
        return (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to Merchant Services!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                You're now set up as an organization account. This wizard will help you 
                configure your merchant services and get the most out of the platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-muted rounded-lg">
                  <QrCode className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">QR Codes</h3>
                  <p className="text-sm text-muted-foreground">Create custom QR codes for customer engagement</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Team Management</h3>
                  <p className="text-sm text-muted-foreground">Invite team members and manage permissions</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Branding</h3>
                  <p className="text-sm text-muted-foreground">Customize your organization's appearance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'qr-setup':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                QR codes allow customers to quickly connect with your organization. 
                You can create different types of QR codes for various purposes.
              </p>
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Store Entry QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Place at your entrance for customers to scan when they visit
                  </p>
                  <Button variant="outline" className="w-full">
                    Create Store Entry QR Code
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Loyalty Program QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Let customers join your loyalty program instantly
                  </p>
                  <Button variant="outline" className="w-full">
                    Create Loyalty QR Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'complete':
        return (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Setup Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Congratulations! Your merchant account is now fully configured and ready to use.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{completedSteps}</div>
                  <div className="text-sm text-muted-foreground">Steps Completed</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">Ready</div>
                  <div className="text-sm text-muted-foreground">Account Status</div>
                </div>
              </div>
              <Button className="w-full mt-6" onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        );
      
      default:
        return <div>Step content not found</div>;
    }
  };

  // Don't show for individual accounts
  if (profile?.account_type === 'individual') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Merchant onboarding is only available for organization accounts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Merchant Setup Wizard
            </CardTitle>
            <Badge variant="outline">
              {completedSteps} of {steps.length} completed
            </Badge>
          </div>
          <Progress value={progressPercentage} className="mb-4" />
          
          {/* Step Navigation */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${
                  index === currentStep 
                    ? 'bg-primary/10 text-primary' 
                    : step.completed 
                      ? 'text-green-600 hover:bg-green-50' 
                      : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="h-6 w-6" />
                ) : index === currentStep ? (
                  <step.icon className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Current Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantOnboardingWizard;