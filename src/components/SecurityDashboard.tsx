import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Key, 
  Eye, 
  Download, 
  Trash2, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  Unlock,
  FileText,
  Users,
  Settings
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { encryptionService } from '@/utils/encryption';
import { permissionsEngine } from '@/utils/permissionsEngine';
import { gdprService } from '@/utils/gdprCompliance';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/MobileLayout';

export const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [encryptionStatus, setEncryptionStatus] = useState(encryptionService.getEncryptionStatus());
  const [permissionStatus, setPermissionStatus] = useState(permissionsEngine.getPermissionStatus());
  const [complianceStatus, setComplianceStatus] = useState(gdprService.getComplianceStatus());
  const [userConsents, setUserConsents] = useState<any[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState(gdprService.getDataRetentionPolicies());

  useEffect(() => {
    if (user) {
      setUserConsents(gdprService.getUserConsents(user.id));
    }
  }, [user]);

  const handleDataExport = async () => {
    if (!user) return;

    try {
      const result = await gdprService.handleAccessRequest(user.id);
      if (result.success && result.data) {
        // Create downloadable file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opnli-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Data export failed:', error);
    }
  };

  const handleDataDeletion = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to request deletion of your data? This action cannot be undone.'
    );

    if (confirmed) {
      try {
        await gdprService.handleErasureRequest(user.id, 'User requested data deletion');
        alert('Data deletion request submitted. You will be contacted within 30 days.');
      } catch (error) {
        console.error('Data deletion request failed:', error);
      }
    }
  };

  const handleConsentChange = async (consentType: string, granted: boolean) => {
    if (!user) return;

    await gdprService.recordConsent({
      userId: user.id,
      consentType: consentType as any,
      granted,
      context: 'security-dashboard',
      evidence: `User ${granted ? 'granted' : 'revoked'} consent via security dashboard`
    });

    setUserConsents(gdprService.getUserConsents(user.id));
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-foreground">Security & Privacy</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    <strong>Demo Mode:</strong> Security features shown for demonstration. 
                    Full enterprise-grade security in Alpha Testing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground">Manage your data security, privacy, and compliance settings</p>
        </div>

        {/* Security Overview */}
        <Card className="bg-gradient-to-br from-background to-muted/30 border-benefit/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-benefit" />
              Security Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-benefit/5 border border-benefit/20">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4 text-benefit" />
                  <span className="text-sm font-medium">Encryption</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {encryptionStatus.encryptionLevel === 'demo' ? 'Demo Level' : 'Full E2E'}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs bg-benefit/10 text-benefit">
                  {encryptionStatus.isDemoMode ? 'Demo' : 'Active'}
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Permissions</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {permissionStatus.enforcementLevel.replace('-', ' ')}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs bg-accent/10 text-accent">
                  {permissionStatus.isDemoMode ? 'Demo' : 'Enforced'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="privacy" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy" className="space-y-4">
            {/* Data Encryption */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4" />
                  Data Encryption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sensitive Card Data</span>
                    <Badge variant={encryptionStatus.isDemoMode ? "secondary" : "default"}>
                      {encryptionStatus.isDemoMode ? 'Demo Encryption' : 'E2E Encrypted'}
                    </Badge>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      {encryptionStatus.warningMessage}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Card Field Values</span>
                      <CheckCircle className="h-4 w-4 text-benefit" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Family Relationships</span>
                      <CheckCircle className="h-4 w-4 text-benefit" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Personal Information</span>
                      <CheckCircle className="h-4 w-4 text-benefit" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Your Data Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={handleDataExport}
                  className="w-full flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export My Data
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleDataDeletion}
                  className="w-full flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Request Data Deletion
                </Button>

                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Demo Mode:</strong> Data export generates sample data. 
                    In Alpha Testing, you'll receive your complete data archive.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" />
                  Sharing Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permissionsEngine.getPermissionTemplates() && 
                    Object.entries(permissionsEngine.getPermissionTemplates()).map(([template, permissions]) => (
                    <div key={template} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm capitalize">{template.replace('-', ' ')}</h4>
                        <Badge variant="outline" className="text-xs">Template</Badge>
                      </div>
                      <div className="space-y-1">
                        {permissions.map((perm, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="capitalize">{perm.action} {perm.resource}</span>
                            {perm.granted ? (
                              <CheckCircle className="h-3 w-3 text-benefit" />
                            ) : (
                              <X className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      {permissionStatus.warningMessage}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            {/* GDPR Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  GDPR Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-benefit/5 border border-benefit/20">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Compliance Level</p>
                      <p className="text-sm font-medium text-benefit">
                        {complianceStatus.complianceLevel.replace('-', ' ')}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Data Retention</p>
                      <p className="text-sm font-medium text-accent">Policy-Based</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Consent Management</h4>
                    <div className="space-y-2">
                      {['essential', 'functional', 'analytics', 'sharing'].map((consentType) => {
                        const consent = userConsents.find(c => c.consentType === consentType);
                        const isGranted = consent?.granted ?? false;
                        
                        return (
                          <div key={consentType} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm capitalize">{consentType}</span>
                            <Button
                              variant={isGranted ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleConsentChange(consentType, !isGranted)}
                              className="text-xs"
                            >
                              {isGranted ? 'Granted' : 'Revoked'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Data Retention Policies</h4>
                    <div className="space-y-2">
                      {retentionPolicies.map((policy) => (
                        <div key={policy.id} className="p-2 border rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">
                              {policy.dataType.replace('_', ' ')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {Math.floor(policy.retentionPeriod / 365)}yr
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {policy.legalBasis}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      {complianceStatus.warningMessage}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};