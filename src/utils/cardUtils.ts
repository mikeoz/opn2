
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
  field_name?: string;
  field_type?: string;
}

interface UserCard {
  id: string;
  card_code: string;
  template: CardTemplate;
  field_values: FieldValue[];
}

export const getCardTitle = (card: UserCard): string => {
  if (!card) return '';
  
  console.log('CardUtils - Getting card title for card:', card.id);
  console.log('CardUtils - Field values:', card.field_values);
  console.log('CardUtils - Template name:', card.template.name);
  
  // First priority: Look for Card Label field value
  if (card.field_values && card.field_values.length > 0) {
    // For ViewCard, field_name is directly available
    let cardLabelValue = card.field_values.find(fv => 
      fv.field_name && fv.field_name.toLowerCase().includes('card label')
    );
    
    // For EditCard, we need to find the field name from template
    if (!cardLabelValue) {
      cardLabelValue = card.field_values.find(fv => {
        const templateField = card.template.fields.find(f => f.id === fv.template_field_id);
        return templateField && templateField.field_name.toLowerCase().includes('card label');
      });
    }
    
    console.log('CardUtils - Card Label value found:', cardLabelValue);
    
    if (cardLabelValue && cardLabelValue.value && cardLabelValue.value.trim()) {
      console.log('CardUtils - Using Card Label value:', cardLabelValue.value.trim());
      return cardLabelValue.value.trim();
    }
    
    // Second priority: For Social Media Profile, use Service Name
    if (card.template.name === 'Social Media Profile') {
      // For ViewCard, field_name is directly available
      let serviceNameValue = card.field_values.find(fv => 
        fv.field_name && fv.field_name.toLowerCase().includes('service name')
      );
      
      // For EditCard, we need to find the field name from template
      if (!serviceNameValue) {
        serviceNameValue = card.field_values.find(fv => {
          const templateField = card.template.fields.find(f => f.id === fv.template_field_id);
          return templateField && templateField.field_name.toLowerCase().includes('service name');
        });
      }
      
      console.log('CardUtils - Service Name value found:', serviceNameValue);
      if (serviceNameValue && serviceNameValue.value && serviceNameValue.value.trim()) {
        console.log('CardUtils - Using Service Name value:', serviceNameValue.value.trim());
        return serviceNameValue.value.trim();
      }
    }
  }
  
  // Fallback: Use template name
  console.log('CardUtils - Using fallback template name:', card.template.name);
  return card.template.name;
};
