
import { z } from 'zod';

// Standard validation schemas for common field types
export const CommonFieldSchemas = {
  email: z.string().email('Invalid email format'),
  required: z.string().min(1, 'This field is required'),
  optional: z.string().optional(),
  uuid: z.string().uuid('Invalid UUID format'),
  nonEmptyArray: z.array(z.string()).min(1, 'At least one item is required'),
  phoneNumber: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format').optional(),
  url: z.string().url('Invalid URL format').optional(),
};

// Standard form field naming conventions
export const FieldNamingConventions = {
  // Personal fields
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  EMAIL: 'email',
  
  // Organization fields
  ENTITY_NAME: 'entity_name',
  REP_FIRST_NAME: 'rep_first_name',
  REP_LAST_NAME: 'rep_last_name',
  REP_EMAIL: 'rep_email',
  
  // Card template fields
  CARD_NAME: 'card_name',
  CARD_DESCRIPTION: 'card_description',
  CARD_TYPE: 'card_type',
  TEMPLATE_ID: 'template_id',
  
  // Common metadata
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
} as const;

// Form-to-database field mapping utility
export class FieldMapper {
  private static mappings: Record<string, string> = {
    // Form field -> Database field
    firstName: 'first_name',
    lastName: 'last_name',
    entityName: 'entity_name',
    repFirstName: 'rep_first_name',
    repLastName: 'rep_last_name',
    repEmail: 'rep_email',
    cardName: 'name',
    cardDescription: 'description',
    cardType: 'type',
  };

  static mapFormToDatabase(formData: Record<string, any>): Record<string, any> {
    const mappedData: Record<string, any> = {};
    
    for (const [formField, value] of Object.entries(formData)) {
      const dbField = this.mappings[formField] || formField;
      mappedData[dbField] = value;
    }
    
    return mappedData;
  }

  static mapDatabaseToForm(dbData: Record<string, any>): Record<string, any> {
    const formData: Record<string, any> = {};
    const reverseMapping = Object.fromEntries(
      Object.entries(this.mappings).map(([form, db]) => [db, form])
    );
    
    for (const [dbField, value] of Object.entries(dbData)) {
      const formField = reverseMapping[dbField] || dbField;
      formData[formField] = value;
    }
    
    return formData;
  }

  static addMapping(formField: string, dbField: string): void {
    this.mappings[formField] = dbField;
  }
}

// Validation utility for card template forms
export const validateCardTemplateForm = (data: any) => {
  const schema = z.object({
    name: CommonFieldSchemas.required,
    description: CommonFieldSchemas.optional,
    type: z.enum(['user', 'admin', 'access', 'participant', 'transaction']),
    category_id: CommonFieldSchemas.uuid.optional(),
    fields: z.array(z.object({
      field_name: CommonFieldSchemas.required,
      field_type: z.enum(['string', 'image', 'document']),
      is_required: z.boolean().default(false),
      display_order: z.number().int().min(0).default(0),
    })).default([]),
  });

  return schema.safeParse(data);
};
