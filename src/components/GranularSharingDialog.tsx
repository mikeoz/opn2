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
    
    // Enhanced regex patterns for better address parsing
    const addressPatterns = {
      // Full address pattern: number, street, city, state, zip
      fullAddress: /^(\d+)\s+([^,]+),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/,
      // Alternative pattern: number street, city state zip
      altAddress: /^(\d+)\s+([^,]+),\s*([^,]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/,
      // Fallback patterns
      streetNumber: /^(\d+)\s/,
      state: /\b([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/,
      zip: /(\d{5}(?:-\d{4})?)\s*$/
    };

    // Try full address pattern first
    let match = address.match(addressPatterns.fullAddress) || address.match(addressPatterns.altAddress);
    
    if (match) {
      // Full pattern matched: [full, number, street, city, state, zip]
      const [, streetNumber, streetName, city, state, zip] = match;
      
      components.push({
        id: 'streetNumber',
        label: 'Street Number',
        value: streetNumber,
        selected: false,
        icon: <MapPin className="h-4 w-4" />
      });
      
      components.push({
        id: 'streetName',
        label: 'Street Name',
        value: streetName.trim(),
        selected: false,
        icon: <MapPin className="h-4 w-4" />
      });
      
      components.push({
        id: 'city',
        label: 'City',
        value: city.trim(),
        selected: true,
        icon: <MapPin className="h-4 w-4" />
      });
      
      components.push({
        id: 'state',
        label: 'State',
        value: state.trim(),
        selected: true,
        icon: <MapPin className="h-4 w-4" />
      });
      
      components.push({
        id: 'zip',
        label: 'ZIP Code',
        value: zip.trim(),
        selected: false,
        icon: <MapPin className="h-4 w-4" />
      });
    } else {
      // Fallback to individual pattern matching
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

      // Extract state and zip together
      const stateZipMatch = address.match(addressPatterns.state);
      if (stateZipMatch) {
        components.push({
          id: 'state',
          label: 'State',
          value: stateZipMatch[1],
          selected: true,
          icon: <MapPin className="h-4 w-4" />
        });
        
        components.push({
          id: 'zip',
          label: 'ZIP Code',
          value: stateZipMatch[2],
          selected: false,
          icon: <MapPin className="h-4 w-4" />
        });
      }

      // Extract remaining as street name and city (simplified)
      let remaining = address;
      if (streetNumberMatch) {
        remaining = remaining.replace(streetNumberMatch[0], '').trim();
      }
      if (stateZipMatch) {
        remaining = remaining.replace(stateZipMatch[0], '').trim().replace(/,\s*$/, '');
      }
      
      if (remaining) {
        const parts = remaining.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          components.push({
            id: 'streetName',
            label: 'Street Name',
            value: parts[0],
            selected: false,
            icon: <MapPin className="h-4 w-4" />
          });
          
          components.push({
            id: 'city',
            label: 'City',
            value: parts[1],
            selected: true,
            icon: <MapPin className="h-4 w-4" />
          });
        } else if (parts.length === 1) {
          components.push({
            id: 'streetName',
            label: 'Street Name',
            value: parts[0],
            selected: false,
            icon: <MapPin className="h-4 w-4" />
          });
        }
      }
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