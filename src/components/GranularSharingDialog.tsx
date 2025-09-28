import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Share2, User, MapPin, Mail, Phone, Building } from 'lucide-react';

interface FieldComponent {
  id: string;
  label: string;
  value: string;
  selected: boolean;
  icon?: React.ReactNode;
}

interface ParsedField {
  fieldName: string;
  originalValue: string;
  components: FieldComponent[];
}

interface GranularSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: {
    id: string;
    template: {
      name: string;
      fields: Array<{
        id: string;
        field_name: string;
        field_type: string;
      }>;
    };
    field_values: Array<{
      template_field_id: string;
      value: string;
      field_name: string;
    }>;
  };
  onShare: (selectedComponents: Record<string, string[]>) => Promise<void>;
  isSharing: boolean;
}

const GranularSharingDialog: React.FC<GranularSharingDialogProps> = ({
  open,
  onOpenChange,
  card,
  onShare,
  isSharing
}) => {
  const [parsedFields, setParsedFields] = useState<ParsedField[]>([]);

  // Field parsing functions
  const parseFullName = (fullName: string): FieldComponent[] => {
    const nameParts = fullName.trim().split(/\s+/);
    const components: FieldComponent[] = [];
    
    if (nameParts.length >= 1) {
      components.push({
        id: 'firstName',
        label: 'First Name',
        value: nameParts[0],
        selected: true,
        icon: <User className="h-4 w-4" />
      });
    }
    
    if (nameParts.length >= 2) {
      // Middle names (if any)
      if (nameParts.length > 2) {
        const middleNames = nameParts.slice(1, -1).join(' ');
        components.push({
          id: 'middleNames',
          label: 'Middle Name(s)',
          value: middleNames,
          selected: false,
          icon: <User className="h-4 w-4" />
        });
      }
      
      // Last name
      components.push({
        id: 'lastName',
        label: 'Last Name',
        value: nameParts[nameParts.length - 1],
        selected: true,
        icon: <User className="h-4 w-4" />
      });
    }
    
    return components;
  };

  const parseAddress = (address: string): FieldComponent[] => {
    const components: FieldComponent[] = [];
    
    // Simple regex patterns for common address formats
    const addressPatterns = {
      // Street number: leading digits
      streetNumber: /^(\d+)\s/,
      // State: common state abbreviations
      state: /\b([A-Z]{2})\b(?=\s+\d{5}|\s*$)/,
      // ZIP: 5 digit or 5+4 format
      zip: /\b(\d{5}(?:-\d{4})?)\b/,
      // City: word(s) before state and zip
      city: /,\s*([^,]+?)\s+[A-Z]{2}\s+\d{5}/
    };

    // Extract street number
    const streetNumberMatch = address.match(addressPatterns.streetNumber);
    if (streetNumberMatch) {
      components.push({
        id: 'streetNumber',
        label: 'Street Number',
        value: streetNumberMatch[1],
        selected: false,
        icon: <MapPin className="h-4 w-4" />
      });
    }

    // Extract street name (everything after number until comma or city)
    let streetName = address;
    if (streetNumberMatch) {
      streetName = streetName.replace(streetNumberMatch[0], '').trim();
    }
    
    // Remove city, state, zip to get street name
    const stateMatch = address.match(addressPatterns.state);
    const zipMatch = address.match(addressPatterns.zip);
    const cityMatch = address.match(addressPatterns.city);
    
    if (cityMatch) {
      const cityIndex = address.indexOf(cityMatch[0]);
      streetName = streetName.substring(0, cityIndex).replace(/,\s*$/, '').trim();
    }
    
    if (streetName && streetName !== address) {
      components.push({
        id: 'streetName',
        label: 'Street Name',
        value: streetName,
        selected: false,
        icon: <MapPin className="h-4 w-4" />
      });
    }

    // Extract city
    if (cityMatch) {
      components.push({
        id: 'city',
        label: 'City',
        value: cityMatch[1].trim(),
        selected: true,
        icon: <MapPin className="h-4 w-4" />
      });
    }

    // Extract state
    if (stateMatch) {
      components.push({
        id: 'state',
        label: 'State',
        value: stateMatch[1],
        selected: true,
        icon: <MapPin className="h-4 w-4" />
      });
    }

    // Extract ZIP
    if (zipMatch) {
      components.push({
        id: 'zip',
        label: 'ZIP Code',
        value: zipMatch[1],
        selected: false,
        icon: <MapPin className="h-4 w-4" />
      });
    }

    return components;
  };

  const parseEmail = (email: string): FieldComponent[] => {
    const components: FieldComponent[] = [];
    const emailParts = email.split('@');
    
    if (emailParts.length === 2) {
      components.push({
        id: 'emailUsername',
        label: 'Email Username',
        value: emailParts[0],
        selected: false,
        icon: <Mail className="h-4 w-4" />
      });
      
      components.push({
        id: 'emailDomain',
        label: 'Email Domain',
        value: emailParts[1],
        selected: true,
        icon: <Mail className="h-4 w-4" />
      });
    }
    
    return components;
  };

  const parsePhone = (phone: string): FieldComponent[] => {
    const components: FieldComponent[] = [];
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length >= 10) {
      // US phone number format
      const areaCode = digits.substring(digits.length - 10, digits.length - 7);
      const exchange = digits.substring(digits.length - 7, digits.length - 4);
      const number = digits.substring(digits.length - 4);
      
      components.push({
        id: 'areaCode',
        label: 'Area Code',
        value: areaCode,
        selected: true,
        icon: <Phone className="h-4 w-4" />
      });
      
      components.push({
        id: 'phoneExchange',
        label: 'Exchange',
        value: exchange,
        selected: false,
        icon: <Phone className="h-4 w-4" />
      });
      
      components.push({
        id: 'phoneNumber',
        label: 'Number',
        value: number,
        selected: false,
        icon: <Phone className="h-4 w-4" />
      });
    }
    
    return components;
  };

  const parseField = (fieldName: string, value: string): FieldComponent[] => {
    const lowerFieldName = fieldName.toLowerCase();
    
    if (lowerFieldName.includes('name') && lowerFieldName.includes('full')) {
      return parseFullName(value);
    } else if (lowerFieldName.includes('address')) {
      return parseAddress(value);
    } else if (lowerFieldName.includes('email')) {
      return parseEmail(value);
    } else if (lowerFieldName.includes('phone')) {
      return parsePhone(value);
    }
    
    // Default: treat as single component
    return [{
      id: 'full',
      label: fieldName,
      value: value,
      selected: true,
      icon: <Building className="h-4 w-4" />
    }];
  };

  useEffect(() => {
    if (open && card) {
      const parsed = card.field_values
        .filter(fv => fv.value && fv.value.trim() !== '')
        .map(fieldValue => ({
          fieldName: fieldValue.field_name,
          originalValue: fieldValue.value,
          components: parseField(fieldValue.field_name, fieldValue.value)
        }));
      
      setParsedFields(parsed);
    }
  }, [open, card]);

  const toggleComponent = (fieldName: string, componentId: string) => {
    setParsedFields(prev => 
      prev.map(field => 
        field.fieldName === fieldName
          ? {
              ...field,
              components: field.components.map(comp =>
                comp.id === componentId
                  ? { ...comp, selected: !comp.selected }
                  : comp
              )
            }
          : field
      )
    );
  };

  const handleShare = async () => {
    const selectedComponents: Record<string, string[]> = {};
    
    parsedFields.forEach(field => {
      const selected = field.components
        .filter(comp => comp.selected)
        .map(comp => `${comp.label}: ${comp.value}`);
      
      if (selected.length > 0) {
        selectedComponents[field.fieldName] = selected;
      }
    });

    await onShare(selectedComponents);
  };

  const getSelectedCount = () => {
    return parsedFields.reduce((total, field) => 
      total + field.components.filter(comp => comp.selected).length, 0
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Card - Select Information
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Choose specific pieces of information to share with others
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {parsedFields.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {getSelectedCount()} components selected
                </Badge>
              </div>
              
              {parsedFields.map((field, fieldIndex) => (
                <Card key={fieldIndex}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{field.fieldName}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Original: "{field.originalValue}"
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3">
                      {field.components.map((component) => (
                        <div key={component.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`${fieldIndex}-${component.id}`}
                            checked={component.selected}
                            onCheckedChange={() => toggleComponent(field.fieldName, component.id)}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            {component.icon}
                            <span className="text-sm font-medium">{component.label}:</span>
                            <span className="text-sm text-muted-foreground">{component.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Separator />
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleShare} 
                  disabled={isSharing || getSelectedCount() === 0}
                >
                  {isSharing ? 'Sharing...' : `Share Selected (${getSelectedCount()})`}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No field data available for sharing
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GranularSharingDialog;