import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ChevronRight } from 'lucide-react';
import { ConnectionWithCards } from '@/hooks/useConnectionCards';

interface ConnectionCardItemProps {
  connection: ConnectionWithCards;
  onClick: () => void;
}

const ConnectionCardItem: React.FC<ConnectionCardItemProps> = ({ connection, onClick }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRelationshipType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={connection.avatar_url} alt={connection.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(connection.name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {connection.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {formatRelationshipType(connection.relationship_type)}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                <span>{connection.totalCards} card{connection.totalCards !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionCardItem;
