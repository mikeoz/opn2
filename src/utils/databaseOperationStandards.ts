
import { supabase } from '@/integrations/supabase/client';
import { FieldMapper } from './formValidationStandards';

// Standard database operation patterns
export class DatabaseOperations {
  // Verify table exists before operations
  static async verifyTableExists(tableName: string): Promise<boolean> {
    try {
      // Use type assertion to bypass strict typing for dynamic table names
      const { error } = await (supabase as any)
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  // Test RLS policies before form submission
  static async testRLSAccess(tableName: string, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'): Promise<boolean> {
    try {
      const client = supabase as any;
      
      switch (operation) {
        case 'SELECT':
          const { error: selectError } = await client.from(tableName).select('*').limit(1);
          return !selectError;
        
        case 'INSERT':
          // Test with minimal valid data - will fail validation but should pass RLS
          const { error: insertError } = await client.from(tableName).insert({
            // Provide minimal required fields that most tables have
            ...(tableName === 'card_templates' && { name: 'test', type: 'user' }),
            ...(tableName === 'profiles' && { account_type: 'individual', guid: 'test' }),
            ...(tableName === 'user_cards' && { card_code: 'test', template_id: 'test', user_id: 'test' }),
          });
          // If it's a validation error, RLS is working. If it's permission error, RLS failed
          return !insertError || !insertError.message.includes('permission');
        
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // Safe insert with field mapping and validation
  static async safeInsert<T = any>(
    tableName: string,
    formData: Record<string, any>,
    validateFunction?: (data: any) => { success: boolean; error?: any }
  ): Promise<{ data?: T; error?: string }> {
    try {
      // 1. Verify table exists
      const tableExists = await this.verifyTableExists(tableName);
      if (!tableExists) {
        return { error: `Table ${tableName} does not exist or is not accessible` };
      }

      // 2. Validate form data if validator provided
      if (validateFunction) {
        const validation = validateFunction(formData);
        if (!validation.success) {
          return { error: `Validation failed: ${validation.error}` };
        }
      }

      // 3. Map form fields to database fields
      const mappedData = FieldMapper.mapFormToDatabase(formData);

      // 4. Add audit fields
      const dataWithAudit = {
        ...mappedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 5. Attempt insert using type assertion
      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert(dataWithAudit)
        .select()
        .single();

      if (error) {
        console.error(`Database insert failed for ${tableName}:`, error);
        return { error: `Failed to create record: ${error.message}` };
      }

      return { data };
    } catch (err: any) {
      console.error(`Unexpected error in safeInsert for ${tableName}:`, err);
      return { error: `Unexpected error: ${err.message}` };
    }
  }

  // Test complete flow: validation → mapping → insert
  static async testCompleteFlow(
    tableName: string,
    sampleFormData: Record<string, any>,
    validateFunction?: (data: any) => { success: boolean; error?: any }
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Test table existence
    const tableExists = await this.verifyTableExists(tableName);
    if (!tableExists) {
      errors.push(`Table ${tableName} does not exist or is not accessible`);
    }

    // Test RLS permissions
    const canSelect = await this.testRLSAccess(tableName, 'SELECT');
    const canInsert = await this.testRLSAccess(tableName, 'INSERT');
    
    if (!canSelect) errors.push(`No SELECT permission on ${tableName}`);
    if (!canInsert) errors.push(`No INSERT permission on ${tableName}`);

    // Test validation if provided
    if (validateFunction) {
      const validation = validateFunction(sampleFormData);
      if (!validation.success) {
        errors.push(`Validation failed: ${validation.error}`);
      }
    }

    // Test field mapping
    try {
      FieldMapper.mapFormToDatabase(sampleFormData);
    } catch (err: any) {
      errors.push(`Field mapping failed: ${err.message}`);
    }

    return {
      success: errors.length === 0,
      errors
    };
  }
}
