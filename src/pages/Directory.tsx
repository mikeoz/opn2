import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MobileLayout from '@/components/MobileLayout';
import { useConnectionCards, ConnectionWithCards } from '@/hooks/useConnectionCards';
import ConnectionCardItem from '@/components/ConnectionCardItem';
import ConnectionDetailDialog from '@/components/ConnectionDetailDialog';

const Directory = () => {
  const { connectionsWithCards, loading, hasConnections } = useConnectionCards();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<ConnectionWithCards | null>(null);

  // Filter connections based on search term
  const filteredConnections = useMemo(() => {
    if (!searchTerm.trim()) return connectionsWithCards;
    
    const search = searchTerm.toLowerCase();
    return connectionsWithCards.filter(connection => 
      connection.name.toLowerCase().includes(search) ||
      connection.relationship_type.toLowerCase().includes(search) ||
      connection.cards.some(card => 
        card.card_code.toLowerCase().includes(search) ||
        card.card_type.toLowerCase().includes(search) ||
        card.template_name?.toLowerCase().includes(search)
      )
    );
  }, [connectionsWithCards, searchTerm]);

  return (
    <MobileLayout>
      <div className="p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">CARD Directory</h1>
          <p className="text-muted-foreground">View people you've shared CARDs with</p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, card type, or code..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Directory Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              My Connections
              {hasConnections && (
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {filteredConnections.length} {filteredConnections.length === 1 ? 'person' : 'people'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !hasConnections ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-semibold mb-1">No connections yet</p>
                <p className="text-sm">Share your CARDs with others to see them here</p>
              </div>
            ) : filteredConnections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-semibold mb-1">No matches found</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConnections.map((connection) => (
                  <ConnectionCardItem
                    key={connection.connectionId}
                    connection={connection}
                    onClick={() => setSelectedConnection(connection)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <ConnectionDetailDialog
        connection={selectedConnection}
        open={!!selectedConnection}
        onOpenChange={(open) => !open && setSelectedConnection(null)}
      />
    </MobileLayout>
  );
};

export default Directory;
