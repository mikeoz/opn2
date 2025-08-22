import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Gift, 
  Star, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Trophy,
  Users,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  pointsPerVisit: number;
  pointsPerDollar: number;
  rewards: LoyaltyReward[];
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  rewardType: 'discount' | 'freeItem' | 'coupon';
  value: number; // percentage for discount, or fixed amount
  isActive: boolean;
}

export default function LoyaltyProgramManager() {
  const [program, setProgram] = useState<LoyaltyProgram>({
    id: 'demo-program',
    name: 'VIP Rewards',
    description: 'Earn points with every visit and purchase!',
    isActive: true,
    pointsPerVisit: 10,
    pointsPerDollar: 1,
    rewards: [
      {
        id: 'reward-1',
        name: '10% Off Next Purchase',
        description: 'Save 10% on your next order',
        pointsRequired: 100,
        rewardType: 'discount',
        value: 10,
        isActive: true
      },
      {
        id: 'reward-2',
        name: 'Free Coffee',
        description: 'Complimentary coffee of your choice',
        pointsRequired: 200,
        rewardType: 'freeItem',
        value: 5, // dollar value
        isActive: true
      },
      {
        id: 'reward-3',
        name: '25% Off Entire Order',
        description: 'Big savings on everything!',
        pointsRequired: 500,
        rewardType: 'discount',
        value: 25,
        isActive: true
      }
    ]
  });

  const [showAddReward, setShowAddReward] = useState(false);
  const [newReward, setNewReward] = useState<Partial<LoyaltyReward>>({
    name: '',
    description: '',
    pointsRequired: 100,
    rewardType: 'discount',
    value: 10,
    isActive: true
  });

  const [programStats] = useState({
    totalMembers: 156,
    activeMembers: 89,
    totalPointsIssued: 12450,
    rewardsRedeemed: 34,
    averagePointsPerMember: 142
  });

  const updateProgram = (updates: Partial<LoyaltyProgram>) => {
    setProgram(prev => ({ ...prev, ...updates }));
    toast.success('Program updated successfully!');
  };

  const addReward = () => {
    if (!newReward.name || !newReward.pointsRequired) {
      toast.error('Please fill in required fields');
      return;
    }

    const reward: LoyaltyReward = {
      id: `reward-${Date.now()}`,
      name: newReward.name!,
      description: newReward.description || '',
      pointsRequired: newReward.pointsRequired!,
      rewardType: newReward.rewardType || 'discount',
      value: newReward.value || 0,
      isActive: true
    };

    setProgram(prev => ({
      ...prev,
      rewards: [...prev.rewards, reward]
    }));

    setNewReward({
      name: '',
      description: '',
      pointsRequired: 100,
      rewardType: 'discount',
      value: 10,
      isActive: true
    });
    setShowAddReward(false);
    toast.success('Reward added successfully!');
  };

  const toggleReward = (rewardId: string) => {
    setProgram(prev => ({
      ...prev,
      rewards: prev.rewards.map(reward =>
        reward.id === rewardId ? { ...reward, isActive: !reward.isActive } : reward
      )
    }));
    toast.success('Reward updated successfully!');
  };

  const removeReward = (rewardId: string) => {
    setProgram(prev => ({
      ...prev,
      rewards: prev.rewards.filter(reward => reward.id !== rewardId)
    }));
    toast.success('Reward removed successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Loyalty Program Manager</h2>
        </div>
        <Badge variant={program.isActive ? "default" : "secondary"}>
          {program.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Demo Mode Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> Loyalty program settings are simulated. In Alpha Testing, this will connect to real customer accounts and point tracking.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Program Settings</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Program Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Program Status</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable your loyalty program</p>
                </div>
                <Switch
                  checked={program.isActive}
                  onCheckedChange={(checked) => updateProgram({ isActive: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="programName">Program Name</Label>
                  <Input
                    id="programName"
                    value={program.name}
                    onChange={(e) => updateProgram({ name: e.target.value })}
                    placeholder="VIP Rewards"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="programDescription">Description</Label>
                  <Textarea
                    id="programDescription"
                    value={program.description}
                    onChange={(e) => updateProgram({ description: e.target.value })}
                    placeholder="Describe your loyalty program..."
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerVisit">Points per Visit</Label>
                  <Input
                    id="pointsPerVisit"
                    type="number"
                    value={program.pointsPerVisit}
                    onChange={(e) => updateProgram({ pointsPerVisit: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">Points earned for each store visit</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pointsPerDollar">Points per Dollar Spent</Label>
                  <Input
                    id="pointsPerDollar"
                    type="number"
                    value={program.pointsPerDollar}
                    onChange={(e) => updateProgram({ pointsPerDollar: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">Points earned per dollar spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rewards</h3>
              <Button onClick={() => setShowAddReward(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Reward
              </Button>
            </div>

            {showAddReward && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Reward</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rewardName">Reward Name</Label>
                      <Input
                        id="rewardName"
                        value={newReward.name || ''}
                        onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                        placeholder="10% Off Next Purchase"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pointsRequired">Points Required</Label>
                      <Input
                        id="pointsRequired"
                        type="number"
                        value={newReward.pointsRequired || 100}
                        onChange={(e) => setNewReward({ ...newReward, pointsRequired: parseInt(e.target.value) || 0 })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rewardDescription">Description</Label>
                    <Textarea
                      id="rewardDescription"
                      value={newReward.description || ''}
                      onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                      placeholder="Describe the reward..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reward Type</Label>
                      <select
                        className="w-full p-2 border border-border rounded-md"
                        value={newReward.rewardType || 'discount'}
                        onChange={(e) => setNewReward({ ...newReward, rewardType: e.target.value as any })}
                      >
                        <option value="discount">Percentage Discount</option>
                        <option value="freeItem">Free Item</option>
                        <option value="coupon">Fixed Amount Off</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rewardValue">
                        {newReward.rewardType === 'discount' ? 'Discount %' : 'Value ($)'}
                      </Label>
                      <Input
                        id="rewardValue"
                        type="number"
                        value={newReward.value || 0}
                        onChange={(e) => setNewReward({ ...newReward, value: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addReward}>Add Reward</Button>
                    <Button variant="outline" onClick={() => setShowAddReward(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {program.rewards.map((reward) => (
                <Card key={reward.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {reward.rewardType === 'discount' && <Gift className="h-5 w-5 text-primary" />}
                          {reward.rewardType === 'freeItem' && <Star className="h-5 w-5 text-primary" />}
                          {reward.rewardType === 'coupon' && <Trophy className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <h4 className="font-semibold">{reward.name}</h4>
                          <p className="text-sm text-muted-foreground">{reward.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{reward.pointsRequired} points</Badge>
                            <Badge variant={reward.isActive ? "default" : "secondary"}>
                              {reward.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleReward(reward.id)}
                        >
                          {reward.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeReward(reward.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programStats.totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {programStats.activeMembers} active this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Issued</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programStats.totalPointsIssued.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {programStats.averagePointsPerMember} avg per member
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programStats.rewardsRedeemed}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((programStats.rewardsRedeemed / programStats.totalMembers) * 100)}% redemption rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reward Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {program.rewards.map((reward, index) => {
                  const redemptions = Math.floor(Math.random() * 20) + 1; // Demo data
                  const percentage = Math.round((redemptions / programStats.rewardsRedeemed) * 100);
                  
                  return (
                    <div key={reward.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{reward.name}</span>
                          <span className="text-sm text-muted-foreground">{redemptions} redeemed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}