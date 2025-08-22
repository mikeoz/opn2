import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Search, 
  CreditCard, 
  Users, 
  Share2, 
  BarChart3, 
  Download, 
  Trash2, 
  Edit, 
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import MobileLayout from '@/components/MobileLayout';

interface UserCard {
  id: string;
  card_code: string;
  template: {
    name: string;
    type: string;
    description?: string;
  };
  field_values: Array<{
    template_field_id: string;
    value: string;
    field_name?: string;
    field_type?: string;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_shared_at?: string;
  share_count?: number;
  view_count?: number;
}

interface SharingRelationship {
  id: string;
  shared_with_email: string;
  shared_with_name?: string;
  shared_at: string;
  access_level: 'view' | 'edit';
  is_active: boolean;
}

const CardRepository = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [sharingData, setSharingData] = useState<Record<string, SharingRelationship[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [deleteDialogCard, setDeleteDialogCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.id) {
      fetchUserCards();
      fetchSharingData();
    }
  }, [user?.id]);

  const fetchUserCards = async () => {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCards = data?.map(card => ({
        id: card.id,
        card_code: card.card_code,
        template: {
          name: 'Card Template',
          type: 'user',
          description: 'User created card'
        },
        field_values: [],
        is_active: true, // Default to true for now
        created_at: card.created_at,
        updated_at: card.updated_at,
        share_count: Math.floor(Math.random() * 10), // Mock data
        view_count: Math.floor(Math.random() * 50), // Mock data
        last_shared_at: Math.random() > 0.5 ? new Date().toISOString() : null
      })) || [];

      setCards(formattedCards);
    } catch (error) {
      console.error('Error fetching user cards:', error);
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchSharingData = async () => {
    // Mock sharing data - in real app, fetch from sharing relationships table
    const mockSharing: Record<string, SharingRelationship[]> = {};
    // This would be replaced with actual Supabase query
    setSharingData(mockSharing);
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('user_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCards(cards.filter(card => card.id !== cardId));
      toast.success('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    } finally {
      setDeleteDialogCard(null);
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    // Implement bulk actions
    toast.info(`Bulk ${action} for ${selectedCards.length} cards`);
  };

  const exportCards = () => {
    // Implement export functionality
    toast.info('Exporting cards...');
  };

  const getCardTitle = (card: UserCard): string => {
    const labelField = card.field_values.find(fv => 
      fv.field_name?.toLowerCase().includes('label') || 
      fv.field_name?.toLowerCase().includes('name')
    );
    return labelField?.value || card.template.name || 'Untitled Card';
  };

  const getCardStatus = (card: UserCard) => {
    if (!card.is_active) return { status: 'inactive', icon: XCircle, color: 'text-red-500' };
    if (card.share_count && card.share_count > 0) return { status: 'shared', icon: CheckCircle, color: 'text-green-500' };
    return { status: 'active', icon: AlertCircle, color: 'text-yellow-500' };
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = getCardTitle(card).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && card.is_active) ||
                         (statusFilter === 'inactive' && !card.is_active) ||
                         (statusFilter === 'shared' && card.share_count && card.share_count > 0);
    return matchesSearch && matchesStatus;
  });

  const renderCardItem = (card: UserCard) => {
    const cardStatus = getCardStatus(card);
    const StatusIcon = cardStatus.icon;

    return (
      <Card key={card.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedCards.includes(card.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCards([...selectedCards, card.id]);
                  } else {
                    setSelectedCards(selectedCards.filter(id => id !== card.id));
                  }
                }}
                className="rounded"
              />
              <div>
                <CardTitle className="text-base">{getCardTitle(card)}</CardTitle>
                <p className="text-xs text-muted-foreground">{card.template.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${cardStatus.color}`} />
              <Badge variant="secondary" className="text-xs">
                {card.card_code}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            <div>
              <span className="text-muted-foreground">Shares:</span>
              <span className="font-medium ml-1">{card.share_count || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Views:</span>
              <span className="font-medium ml-1">{card.view_count || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium ml-1">
                {new Date(card.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Shared:</span>
              <span className="font-medium ml-1">
                {card.last_shared_at ? new Date(card.last_shared_at).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link to={`/cards/view/${card.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link to={`/cards/edit/${card.id}`}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Link>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => setDeleteDialogCard(card.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAnalytics = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-sm text-muted-foreground">Total Cards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{cards.filter(c => c.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Active Cards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {cards.reduce((sum, card) => sum + (card.share_count || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Shares</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {cards.reduce((sum, card) => sum + (card.view_count || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Card Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(
              cards.reduce((acc, card) => {
                acc[card.template.type] = (acc[card.template.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="capitalize">{type}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="text-center py-8">
            <p>Loading your card repository...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Personal CARD Repository
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your active cards, sharing relationships, and analytics
            </p>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sharing">Sharing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Search and Filter Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search your cards..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cards</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="shared">Shared</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" onClick={exportCards}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedCards.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedCards.length} card(s) selected
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                        Activate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                        Deactivate
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cards List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Your Cards ({filteredCards.length})
                </h2>
              </div>
              
              {filteredCards.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No cards found matching your criteria'
                        : 'You haven\'t created any cards yet'
                      }
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <Button asChild className="mt-4">
                        <Link to="/cards">Create Your First Card</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredCards.map(renderCardItem)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sharing" className="space-y-4">
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Sharing relationships view coming soon
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Track who can see your cards and manage permissions
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {renderAnalytics()}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteDialogCard} onOpenChange={() => setDeleteDialogCard(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Card</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this card? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteDialogCard && handleDeleteCard(deleteDialogCard)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileLayout>
  );
};

export default CardRepository;