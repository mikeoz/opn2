import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar } from 'lucide-react';
import { ConnectionWithCards } from '@/hooks/useConnectionCards';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionDetailDialogProps {
  connection: ConnectionWithCards | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConnectionDetailDialog: React.FC<ConnectionDetailDialogProps> = ({
  connection,
  open,
  onOpenChange,
}) => {
  if (!connection) return null;

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

  const formatCardType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connection Details</DialogTitle>
        </DialogHeader>

        {/* Profile Section */}
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={connection.avatar_url} alt={connection.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(connection.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {connection.name}
            </h3>
            <Badge variant="secondary" className="mt-1">
              {formatRelationshipType(connection.relationship_type)}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Cards Section */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Shared Cards ({connection.totalCards})
          </h4>

          <div className="space-y-2">
            {connection.cards.map((card) => (
              <Card key={card.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {card.card_code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatCardType(card.card_type)}
                        </Badge>
                      </div>
                      {card.template_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {card.template_name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Shared {formatDistanceToNow(new Date(card.shared_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionDetailDialog;
