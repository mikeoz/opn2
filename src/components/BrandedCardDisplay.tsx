import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Image, Upload } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import opnliLogoFooter from "@/assets/opnli-logo-footer.png";

interface TemplateField {
  id: string;
  field_name: string;
  field_type: 'string' | 'image' | 'document';
  is_required: boolean;
  display_order: number;
}

interface CardTemplate {
  id: string;
  name: string;
  description: string;
  type: 'admin' | 'user' | 'access' | 'participant' | 'transaction';
  transaction_code: 'S' | 'N';
  fields: TemplateField[];
}

interface FieldValue {
  template_field_id: string;
  value: string;
  field_name: string;
  field_type: string;
}

interface UserCard {
  id: string;
  card_code: string;
  template: CardTemplate;
  field_values: FieldValue[];
}

interface BrandedCardDisplayProps {
  card: UserCard;
  showHeader?: boolean;
  showBadges?: boolean;
  className?: string;
  cardType?: string;
}

const BrandedCardDisplay: React.FC<BrandedCardDisplayProps> = ({ 
  card, 
  showHeader = true, 
  showBadges = true,
  className = "",
  cardType = card.template.name.toLowerCase()
}) => {
  const { profile } = useProfile();
  const isOrganizationCard = profile?.account_type === 'non_individual';
  const hasOrganizationLogo = isOrganizationCard && profile?.logo_url;

  const getFieldValue = (fieldId: string) => {
    const fieldValue = card.field_values.find(fv => fv.template_field_id === fieldId);
    return fieldValue?.value || '';
  };

  const renderFieldValue = (field: TemplateField) => {
    const value = getFieldValue(field.id);
    
    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center gap-2">
          {field.field_type === 'string' && <FileText className="h-4 w-4 text-muted-foreground" />}
          {field.field_type === 'image' && <Image className="h-4 w-4 text-muted-foreground" />}
          {field.field_type === 'document' && <Upload className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium text-foreground">{field.field_name}:</span>
        </div>
        <div className="pl-6">
          {field.field_type === 'string' ? (
            <p className="text-foreground">{value || 'Not provided'}</p>
          ) : field.field_type === 'image' && value ? (
            <div className="space-y-2">
              <img 
                src={value} 
                alt={field.field_name}
                className="max-w-full max-h-64 rounded-lg shadow-md object-contain"
              />
              <a 
                href={value} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-primary hover:underline block"
              >
                View full size
              </a>
            </div>
          ) : field.field_type === 'document' && value ? (
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              View document
            </a>
          ) : (
            <p className="text-muted-foreground">Not provided</p>
          )}
        </div>
      </div>
    );
  };

  const sortedFields = card.template.fields.sort((a, b) => a.display_order - b.display_order);

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {/* Organization Logo */}
              {isOrganizationCard && (
                <Avatar className="h-12 w-12 border-2 border-muted">
                  <AvatarImage 
                    src={profile?.logo_url} 
                    alt={`${profile?.organization_name} logo`}
                    className="object-contain"
                  />
                  <AvatarFallback>
                    <Building2 className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl break-words">
                  {/* Show organization name for org cards, or template name for individual cards */}
                  {isOrganizationCard && profile?.organization_name 
                    ? profile.organization_name 
                    : card.template.name
                  }
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOrganizationCard 
                    ? `${card.template.name} - ${card.card_code}`
                    : `Card ID: ${card.card_code}`
                  }
                </p>
                {card.template.description && (
                  <p className="text-muted-foreground text-sm mt-1 break-words">
                    {card.template.description}
                  </p>
                )}
              </div>
            </div>
            
            {showBadges && (
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Badge variant={card.template.type === 'admin' ? 'default' : 'secondary'}>
                  {card.template.type === 'admin' ? 'Admin' : 'Custom'}
                </Badge>
                <Badge variant={card.template.transaction_code === 'S' ? 'default' : 'destructive'}>
                  {card.template.transaction_code === 'S' ? 'Sharable' : 'Non-Sharable'}
                </Badge>
                {isOrganizationCard && (
                  <Badge variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    Organization
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="space-y-6">
          {sortedFields.map(renderFieldValue)}
          
          {/* Opnli Branding */}
          <div className="card-branding flex items-center justify-between mt-6 pt-4 border-t border-border/20">
            {hasOrganizationLogo ? (
              <img 
                src={profile.logo_url} 
                alt={profile.organization_name || "Organization Logo"} 
                className="h-8 w-auto object-contain"
              />
            ) : (
              <img 
                src={opnliLogoFooter} 
                alt="Opnli" 
                className="h-8 w-auto object-contain"
              />
            )}
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">
                {hasOrganizationLogo ? profile.organization_name : "Powered by Opnli"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandedCardDisplay;