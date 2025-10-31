import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Plus, Settings, TreePine, ArrowLeft, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyUnits, FamilyUnit } from '@/hooks/useFamilyUnits';
import { FamilyUnitCard } from './FamilyUnitCard';
import { CreateFamilyUnitDialog } from './CreateFamilyUnitDialog';
import { EditFamilyUnitDialog } from './EditFamilyUnitDialog';
import { FamilyMembersView } from './FamilyMembersView';
import FamilyMemberManager from './FamilyMemberManager';
import FamilyTreeVisualization from './FamilyTreeVisualization';
import FamilySettings from './FamilySettings';
import { FamilyInvitationsManager } from './FamilyInvitationsManager';
import { FamilyTreeTab } from './FamilyTreeTab';
import { RelationshipCardsView } from './RelationshipCardsView';
import { Link } from 'react-router-dom';

export const FamilyManagement: React.FC = () => {
  const { user } = useAuth();
  const { familyUnits, loading, updateFamilyUnit, deactivateFamilyUnit } = useFamilyUnits();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFamilyUnit, setEditingFamilyUnit] = useState<FamilyUnit | null>(null);
  const [selectedFamilyUnit, setSelectedFamilyUnit] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Reset activeTab when switching between family views
  useEffect(() => {
    if (selectedFamilyUnit) {
      setActiveTab('overview');
    } else {
      setActiveTab('tree');
    }
  }, [selectedFamilyUnit]);

  const groupedByGeneration = familyUnits.reduce((acc, unit) => {
    const gen = unit.generation_level;
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(unit);
    return acc;
  }, {} as Record<number, typeof familyUnits>);

  const generations = Object.keys(groupedByGeneration)
    .map(Number)
    .sort((a, b) => a - b);
  
  const selectedFamily = selectedFamilyUnit 
    ? familyUnits.find(f => f.id === selectedFamilyUnit)
    : null;

  const isOwnerOfSelectedFamily = selectedFamily 
    ? selectedFamily.trust_anchor_user_id === user?.id
    : false;

  const handleEditFamilyUnit = (familyUnit: FamilyUnit) => {
    setEditingFamilyUnit(familyUnit);
    setShowEditDialog(true);
  };

  const handleDeleteFamilyUnit = async (familyUnit: FamilyUnit) => {
    await deactivateFamilyUnit(familyUnit.id);
  };

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
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            {selectedFamily ? selectedFamily.family_label : 'Family Management'}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {selectedFamily 
              ? `Managing ${selectedFamily.family_label} • ${selectedFamily.member_count || 0} members • Generation ${selectedFamily.generation_level}`
              : 'Manage family relationships and generational connections'
            }
          </p>
        </div>
      </div>

      {selectedFamily ? (
        // Individual Family Management View
        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-7 h-auto gap-1 p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="overview" className="text-xs md:text-sm py-2">
                    <TreePine className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Overview</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Overview</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="members" className="text-xs md:text-sm py-2">
                    <Users className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Members</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Members</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="relationships" className="text-xs md:text-sm py-2">
                    <Users className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Relationships</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Relationships</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="cards" className="text-xs md:text-sm py-2">
                    <Settings className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Cards</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Cards</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="settings" className="text-xs md:text-sm py-2">
                    <Settings className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Settings</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="invitations" className="text-xs md:text-sm py-2">
                    <Users className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Invites</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Invitations</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="tree" className="text-xs md:text-sm py-2">
                    <TreePine className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Tree</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Tree</TooltipContent>
              </Tooltip>
            </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TreePine className="h-5 w-5" />
                    Family Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Family Name</label>
                    <p className="text-lg font-medium">{selectedFamily.family_label}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Generation Level</label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Generation {selectedFamily.generation_level}</Badge>
                    </div>
                  </div>
                  
                  {selectedFamily.parent_family && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Parent Family</label>
                      <p>{selectedFamily.parent_family.family_label}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Trust Anchor</label>
                    <div className="flex items-center gap-2">
                      <p>{selectedFamily.trust_anchor_profile?.first_name} {selectedFamily.trust_anchor_profile?.last_name}</p>
                      {isOwnerOfSelectedFamily && (
                        <Badge variant="default" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p>{new Date(selectedFamily.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">{selectedFamily.member_count || 0}</div>
                      <div className="text-sm text-muted-foreground">Members</div>
                    </div>
                    <div className="text-center p-2 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">{selectedFamily.generation_level}</div>
                      <div className="text-sm text-muted-foreground">Generation</div>
                    </div>
                  </div>
                  
                  {(selectedFamily.family_metadata as any)?.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="text-sm mt-1">{(selectedFamily.family_metadata as any).description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <FamilyMemberManager
              familyUnitId={selectedFamily.id}
              familyUnitLabel={selectedFamily.family_label}
              generationLevel={selectedFamily.generation_level}
              trustAnchorUserId={selectedFamily.trust_anchor_user_id}
              isOwner={isOwnerOfSelectedFamily}
            />
          </TabsContent>

          <TabsContent value="relationships">
            <RelationshipCardsView />
          </TabsContent>

          <TabsContent value="cards">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Family Cards</CardTitle>
                  <CardDescription>
                    View and manage cards shared within this family unit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Family card management coming soon!</p>
                    <p className="text-sm">This will show cards associated with this family unit.</p>
                    <div className="mt-4">
                      <Button variant="outline" asChild>
                        <Link to="/cards">
                          View All Cards
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invitations">
            <FamilyInvitationsManager
              familyUnitId={selectedFamily.id}
              familyUnitLabel={selectedFamily.family_label}
              isOwner={selectedFamily.trust_anchor_user_id === user?.id}
            />
          </TabsContent>

          <TabsContent value="tree">
            <FamilyTreeTab
              familyUnitId={selectedFamily.id}
              familyUnitLabel={selectedFamily.family_label}
              isOwner={selectedFamily.trust_anchor_user_id === user?.id}
            />
          </TabsContent>

          <TabsContent value="settings">
            <FamilySettings
              familyUnit={selectedFamily}
              isOwner={isOwnerOfSelectedFamily}
            />
          </TabsContent>
          </Tabs>
        </TooltipProvider>
      ) : (
        // Family Overview/List View
        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 h-auto gap-1 p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="tree" className="text-xs md:text-sm py-2">
                    <TreePine className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Family Tree</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Family Tree</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="overview" className="text-xs md:text-sm py-2">
                    <Users className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Generation View</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">Generation View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="members" className="text-xs md:text-sm py-2">
                    <Users className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">All Members</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">All Members</TooltipContent>
              </Tooltip>
            </TabsList>

          <TabsContent value="tree">
            <FamilyTreeVisualization
              familyUnits={familyUnits}
              selectedFamilyId={selectedFamilyUnit}
              onSelectFamily={setSelectedFamilyUnit}
            />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {familyUnits.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TreePine className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Family Units Yet</h3>
                   <p className="text-muted-foreground text-center mb-4">
                     Create your first family unit to start building your family tree and managing relationships.
                   </p>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button size="sm" className="md:h-10" onClick={() => setShowCreateDialog(true)}>
                         <Plus className="h-4 w-4 md:mr-2" />
                         <span className="hidden sm:inline">Create First Family Unit</span>
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent className="sm:hidden">Create First Family Unit</TooltipContent>
                   </Tooltip>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Member of families */}
                {familyUnits.filter(f => f.isMember && !f.isOwner).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        <Users className="h-3 w-3 mr-1" />
                        Member Of
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {familyUnits.filter(f => f.isMember && !f.isOwner).length} family unit(s)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {familyUnits.filter(f => f.isMember && !f.isOwner).map(unit => (
                        <FamilyUnitCard
                          key={unit.id}
                          familyUnit={unit}
                          onSelect={() => setSelectedFamilyUnit(unit.id)}
                          isSelected={selectedFamilyUnit === unit.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Families you own - grouped by generation */}
                {familyUnits.filter(f => f.isOwner).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-sm">
                        <Crown className="h-3 w-3 mr-1" />
                        Your Families
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {familyUnits.filter(f => f.isOwner).length} family unit(s)
                      </span>
                    </div>
                  </div>
                )}
                {/* Group owned families by generation */}
                {Object.keys(groupedByGeneration)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .filter(generation => groupedByGeneration[generation].some(u => u.isOwner))
                  .map(generation => (
                    <div key={generation} className="space-y-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className="text-sm">
                            Generation {generation}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {groupedByGeneration[generation].filter(u => u.isOwner).length} family unit(s)
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupedByGeneration[generation].filter(u => u.isOwner).map(unit => (
                            <FamilyUnitCard
                              key={unit.id}
                              familyUnit={unit}
                              onSelect={() => setSelectedFamilyUnit(unit.id)}
                              isSelected={selectedFamilyUnit === unit.id}
                              onEdit={handleEditFamilyUnit}
                              onDelete={handleDeleteFamilyUnit}
                            />
                          ))}
                        </div>
                       
                        <div className="flex gap-2 flex-wrap pt-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setShowCreateDialog(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Family Unit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Create a new family unit</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <FamilyMembersView familyUnits={familyUnits} />
          </TabsContent>
          </Tabs>
        </TooltipProvider>
      )}


      <CreateFamilyUnitDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        existingFamilyUnits={familyUnits}
      />

      <EditFamilyUnitDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        familyUnit={editingFamilyUnit}
        onUpdate={updateFamilyUnit}
      />
    </div>
  );
};