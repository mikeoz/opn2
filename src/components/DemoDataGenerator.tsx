import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Users, Package, Download, Play, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { useMerchantCustomers } from '@/hooks/useMerchantCustomers';
import { demoDataGenerator } from '@/utils/demoDataGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GenerationParams {
  customerCount: number;
  inventoryCount: number;
  interactionHistory: boolean;
  dataCompletenessVariation: boolean;
  businessType: 'Restaurant' | 'Retail' | 'Fitness' | 'Beauty' | 'Professional';
}

export const DemoDataGenerator: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { merchantProfile } = useMerchantProfile();
  const { customers, getCustomerStats } = useMerchantCustomers(merchantProfile?.id);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [params, setParams] = useState<GenerationParams>({
    customerCount: 50,
    inventoryCount: 20,
    interactionHistory: true,
    dataCompletenessVariation: true,
    businessType: 'Restaurant'
  });

  const customerStats = getCustomerStats();

  const handleGenerate = async () => {
    if (!merchantProfile?.id) {
      toast({
        title: 'Error',
        description: 'No merchant profile found',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Create generation job
      const { data: job, error: jobError } = await supabase
        .from('demo_generation_jobs')
        .insert({
          created_by: user?.id || '',
          merchant_id: merchantProfile.id,
          job_type: 'customers',
          generation_params: params as any
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Generate customers
      setGenerationProgress(20);
      const customerData = await demoDataGenerator.generateAndSaveCustomers(merchantProfile.id, params);
      
      setGenerationProgress(60);
      
      // Generate inventory
      const inventoryData = await demoDataGenerator.generateAndSaveInventory(merchantProfile.id, params);
      
      setGenerationProgress(90);

      // Update job status
      await supabase
        .from('demo_generation_jobs')
        .update({
          status: 'completed',
          generated_count: customerData.length + inventoryData.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      setGenerationProgress(100);

      toast({
        title: 'Success',
        description: `Generated ${customerData.length} customers and ${inventoryData.length} inventory items`,
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate demo data',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleExportCustomers = () => {
    if (customers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No customers to export',
        variant: 'destructive'
      });
      return;
    }

    const csvData = demoDataGenerator.exportToCSV(
      customers,
      `merchant-customers-${new Date().toISOString().split('T')[0]}.csv`
    );

    toast({
      title: 'Success',
      description: 'Customer data exported successfully'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demo Data Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{customerStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{customerStats.withEmail}</div>
              <div className="text-sm text-muted-foreground">With Email</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{customerStats.withoutEmail}</div>
              <div className="text-sm text-muted-foreground">Without Email</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{customerStats.avgCompleteness}%</div>
              <div className="text-sm text-muted-foreground">Avg Completeness</div>
            </div>
          </div>

          <Separator />

          {/* Generation Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Generation Parameters</h3>
              
              <div className="space-y-2">
                <Label htmlFor="customerCount">Customer Count</Label>
                <Input
                  id="customerCount"
                  type="number"
                  value={params.customerCount}
                  onChange={(e) => setParams(prev => ({
                    ...prev,
                    customerCount: parseInt(e.target.value) || 0
                  }))}
                  min={1}
                  max={1000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventoryCount">Inventory Items Count</Label>
                <Input
                  id="inventoryCount"
                  type="number"
                  value={params.inventoryCount}
                  onChange={(e) => setParams(prev => ({
                    ...prev,
                    inventoryCount: parseInt(e.target.value) || 0
                  }))}
                  min={1}
                  max={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select
                  value={params.businessType}
                  onValueChange={(value) => setParams(prev => ({
                    ...prev,
                    businessType: value as GenerationParams['businessType']
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Fitness">Fitness</SelectItem>
                    <SelectItem value="Beauty">Beauty</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Options</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="interactionHistory"
                  checked={params.interactionHistory}
                  onCheckedChange={(checked) => setParams(prev => ({
                    ...prev,
                    interactionHistory: checked as boolean
                  }))}
                />
                <Label htmlFor="interactionHistory">Generate Interaction History</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dataVariation"
                  checked={params.dataCompletenessVariation}
                  onCheckedChange={(checked) => setParams(prev => ({
                    ...prev,
                    dataCompletenessVariation: checked as boolean
                  }))}
                />
                <Label htmlFor="dataVariation">Vary Data Completeness</Label>
              </div>

              <div className="space-y-2">
                <Label>Customer Status Distribution</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Prospects: 40%</Badge>
                  <Badge variant="outline">Active: 35%</Badge>
                  <Badge variant="outline">Inactive: 15%</Badge>
                  <Badge variant="outline">VIP: 10%</Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generation Progress</Label>
                <span className="text-sm text-muted-foreground">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Demo Data'}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportCustomers}
              disabled={customers.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Customers CSV
            </Button>

            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export Inventory CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};