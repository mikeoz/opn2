import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, TreePine } from 'lucide-react';
import { useFamilyUnits } from '@/hooks/useFamilyUnits';
import { FamilyUnitCard } from './FamilyUnitCard';
import { CreateFamilyUnitDialog } from './CreateFamilyUnitDialog';
import { FamilyMembersView } from './FamilyMembersView';

export const FamilyManagement: React.FC = () => {
  const { familyUnits, loading } = useFamilyUnits();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFamilyUnit, setSelectedFamilyUnit] = useState<string | null>(null);

  const groupedByGeneration = familyUnits.reduce((acc, unit) => {
    const gen = unit.generation_level;
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(unit);
    return acc;
  }, {} as Record<number, typeof familyUnits>);

  const generations = Object.keys(groupedByGeneration)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading family units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Family Management</h2>
          <p className="text-muted-foreground">
            Manage family relationships and generational connections
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Family Unit
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <TreePine className="mr-2 h-4 w-4" />
            Family Tree
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            All Members
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {familyUnits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TreePine className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Family Units Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first family unit to start building your family tree and managing relationships.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Family Unit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {generations.map(generation => (
                <div key={generation} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      Generation {generation}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {groupedByGeneration[generation].length} family unit(s)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedByGeneration[generation].map(unit => (
                      <FamilyUnitCard
                        key={unit.id}
                        familyUnit={unit}
                        onSelect={() => setSelectedFamilyUnit(unit.id)}
                        isSelected={selectedFamilyUnit === unit.id}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <FamilyMembersView familyUnits={familyUnits} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Family Management Settings</CardTitle>
              <CardDescription>
                Configure how family relationships and cards are managed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings panel coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateFamilyUnitDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        existingFamilyUnits={familyUnits}
      />
    </div>
  );
};