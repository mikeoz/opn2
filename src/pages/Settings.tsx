import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Database, 
  Upload, 
  Shield, 
  BarChart3,
  FileText,
  Plus,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import MobileLayout from '@/components/MobileLayout';

const Settings = () => {
  const { isAdmin } = useUserRole();

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Settings & Administration
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your cards, data, and administrative functions
            </p>
          </CardHeader>
        </Card>

        {/* CARD Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CARD Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Explore, manage, and organize your digital cards
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/card-catalog">
                <Search className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">CARD Catalog</div>
                  <div className="text-xs text-muted-foreground">Browse all available card types</div>
                </div>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/card-repository">
                <Database className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Personal CARD Repository</div>
                  <div className="text-xs text-muted-foreground">Manage your active cards and sharing</div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/cards">
                <Plus className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Create New Card</div>
                  <div className="text-xs text-muted-foreground">Add cards from available templates</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Import, export, and backup your information
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/bulk-import">
                <Upload className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Bulk Import</div>
                  <div className="text-xs text-muted-foreground">Import multiple cards and data</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Administrator Tools Section */}
        {isAdmin && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-primary">Administrator Tools</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Advanced administrative functions
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start bg-primary hover:bg-primary/90">
                  <Link to="/admin/cards">
                    <CreditCard className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Manage AdminCARDs</div>
                      <div className="text-xs opacity-90">Create and manage system card templates</div>
                    </div>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/admin/security">
                    <Shield className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Security Dashboard</div>
                      <div className="text-xs text-muted-foreground">Monitor system security and access</div>
                    </div>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/admin/demo-data">
                    <BarChart3 className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Demo Data Generator</div>
                      <div className="text-xs text-muted-foreground">Generate test data for development</div>
                    </div>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Documentation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Help guides and system information
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/user-guide">
                <FileText className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">User Guide</div>
                  <div className="text-xs text-muted-foreground">Learn how to use the platform</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Settings;