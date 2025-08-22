import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TreePine, Users, Crown, ArrowRight, ArrowLeft, Check, Info } from 'lucide-react';
import { FamilyUnit, useFamilyUnits } from '@/hooks/useFamilyUnits';

interface FamilySetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingFamilyUnits: FamilyUnit[];
}

const SETUP_STEPS = [
  { id: 'type', title: 'Family Type', description: 'What kind of family unit are you creating?' },
  { id: 'details', title: 'Family Details', description: 'Basic information about your family' },
  { id: 'relationships', title: 'Relationships', description: 'Set up family connections' },
  { id: 'settings', title: 'Settings', description: 'Configure privacy and sharing options' },
  { id: 'review', title: 'Review', description: 'Confirm your family setup' }
];

const FAMILY_TYPES = [
  {
    id: 'nuclear',
    title: 'Nuclear Family',
    description: 'Parents and children living together',
    icon: '👨‍👩‍👧‍👦',
    benefits: ['Share family schedules', 'Coordinate activities', 'Emergency contacts']
  },
  {
    id: 'extended',
    title: 'Extended Family',
    description: 'Multiple generations and relatives',
    icon: '👴👵👨‍👩‍👧‍👦',
    benefits: ['Multi-generational sharing', 'Family history', 'Event coordination']
  },
  {
    id: 'blended',
    title: 'Blended Family',
    description: 'Combined families from previous relationships',
    icon: '👨‍👩‍👧‍👦',
    benefits: ['Complex relationship management', 'Flexible sharing', 'Multiple households']
  },
  {
    id: 'single',
    title: 'Single Parent',
    description: 'Single parent with children',
    icon: '👨‍👧‍👦',
    benefits: ['Support network building', 'Resource sharing', 'Emergency planning']
  }
];

export const FamilySetupWizard: React.FC<FamilySetupWizardProps> = ({
  open,
  onOpenChange,
  existingFamilyUnits
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const { createFamilyUnit } = useFamilyUnits();

  const [formData, setFormData] = useState({
    familyType: '',
    familyLabel: '',
    description: '',
    parentFamilyUnitId: '',
    generation: 1,
    privacyLevel: 'family',
    allowInvitations: true,
    autoApproveFamily: false,
    shareByDefault: ['basic_info']
  });

  const progress = ((currentStep + 1) / SETUP_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCreating(true);
    
    const metadata = {
      familyType: formData.familyType,
      description: formData.description,
      privacyLevel: formData.privacyLevel,
      allowInvitations: formData.allowInvitations,
      autoApproveFamily: formData.autoApproveFamily,
      shareByDefault: formData.shareByDefault,
      setupMethod: 'wizard',
      setupDate: new Date().toISOString()
    };

    const success = await createFamilyUnit(
      formData.familyLabel,
      formData.parentFamilyUnitId || undefined,
      metadata
    );

    if (success) {
      handleClose();
    }
    setIsCreating(false);
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFormData({
      familyType: '',
      familyLabel: '',
      description: '',
      parentFamilyUnitId: '',
      generation: 1,
      privacyLevel: 'family',
      allowInvitations: true,
      autoApproveFamily: false,
      shareByDefault: ['basic_info']
    });
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!formData.familyType;
      case 1: return !!formData.familyLabel.trim();
      case 2: return true; // Relationships are optional
      case 3: return true; // Settings have defaults
      case 4: return true; // Review step
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">What type of family unit are you creating?</h3>
              <p className="text-sm text-muted-foreground">
                This helps us customize the experience for your family's needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAMILY_TYPES.map(type => (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    formData.familyType === type.id 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, familyType: type.id })}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <CardTitle className="text-base">{type.title}</CardTitle>
                        <CardDescription className="text-sm">{type.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {type.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-green-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Tell us about your family</h3>
              <p className="text-sm text-muted-foreground">
                Basic information to identify and organize your family unit
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="familyLabel">Family Name *</Label>
                <Input
                  id="familyLabel"
                  placeholder="e.g., The Johnson Family, Mike & Sarah"
                  value={formData.familyLabel}
                  onChange={(e) => setFormData({ ...formData, familyLabel: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is how your family will be identified to others
                </p>
              </div>

              {existingFamilyUnits.length > 0 && (
                <div>
                  <Label htmlFor="parentFamily">Parent Family (Optional)</Label>
                  <Select 
                    value={formData.parentFamilyUnitId} 
                    onValueChange={(value) => setFormData({ ...formData, parentFamilyUnitId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Is this a child of another family unit?" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingFamilyUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.family_label} (Gen {unit.generation_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select if this family is part of a larger family structure
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Family Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your family, special traditions, or anything else you'd like to share..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Set up family relationships</h3>
              <p className="text-sm text-muted-foreground">
                You can invite family members after creating the family unit
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Don't worry about adding everyone now. Once your family unit is created, 
                you'll be able to invite members one by one with specific relationship roles.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Trust Anchor Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  As the family creator, you'll be the <strong>Trust Anchor</strong> for this family unit. 
                  This means you can:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Invite new family members</li>
                  <li>Manage family settings and privacy</li>
                  <li>Connect with other family units</li>
                  <li>Share family cards and information</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Configure family settings</h3>
              <p className="text-sm text-muted-foreground">
                Set up privacy and sharing preferences for your family
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Privacy & Invitations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="privacyLevel">Privacy Level</Label>
                    <Select 
                      value={formData.privacyLevel} 
                      onValueChange={(value) => setFormData({ ...formData, privacyLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private - Only invited members</SelectItem>
                        <SelectItem value="family">Family - Extended family can request</SelectItem>
                        <SelectItem value="community">Community - Visible to community</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Invitations</Label>
                      <p className="text-xs text-muted-foreground">
                        Let family members invite others
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={formData.allowInvitations ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, allowInvitations: !formData.allowInvitations })}
                    >
                      {formData.allowInvitations ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        const selectedType = FAMILY_TYPES.find(t => t.id === formData.familyType);
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Review your family setup</h3>
              <p className="text-sm text-muted-foreground">
                Please review the details before creating your family unit
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TreePine className="h-4 w-4" />
                  Family Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Family Type</Label>
                    <div className="flex items-center gap-2">
                      <span>{selectedType?.icon}</span>
                      <span className="font-medium">{selectedType?.title}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Family Name</Label>
                    <p className="font-medium">{formData.familyLabel}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Privacy Level</Label>
                    <Badge variant="outline" className="capitalize">{formData.privacyLevel}</Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Generation</Label>
                    <p className="font-medium">
                      {formData.parentFamilyUnitId 
                        ? `${(existingFamilyUnits.find(u => u.id === formData.parentFamilyUnitId)?.generation_level || 0) + 1}`
                        : '1'
                      }
                    </p>
                  </div>
                </div>

                {formData.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm">{formData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Family Setup Wizard
          </DialogTitle>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {SETUP_STEPS.length}</span>
              <span>{SETUP_STEPS[currentStep].title}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {renderStepContent()}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? handleClose : handlePrevious}
              disabled={isCreating}
            >
              {currentStep === 0 ? (
                <>Cancel</>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </>
              )}
            </Button>

            <Button
              onClick={currentStep === SETUP_STEPS.length - 1 ? handleComplete : handleNext}
              disabled={!canProceed() || isCreating}
            >
              {currentStep === SETUP_STEPS.length - 1 ? (
                isCreating ? 'Creating...' : 'Create Family Unit'
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};