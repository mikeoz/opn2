
// Systematic troubleshooting protocols for card templates and forms

export class TroubleshootingProtocols {
  // Protocol 1: Database-First Error Investigation
  static async investigateDatabaseFirst(tableName: string, operation: string) {
    console.log(`🔍 TROUBLESHOOTING PROTOCOL: Database-First Investigation`);
    console.log(`Table: ${tableName}, Operation: ${operation}`);
    
    const steps = [
      '1. Check if table exists',
      '2. Verify RLS policies allow operation',
      '3. Test database function/trigger if applicable',
      '4. Check for schema mismatches',
      '5. Verify user authentication state'
    ];
    
    console.log('Investigation steps:', steps);
    
    // Import and use our database operations
    const { DatabaseOperations } = await import('./databaseOperationStandards');
    
    // Step 1: Table existence
    const tableExists = await DatabaseOperations.verifyTableExists(tableName);
    console.log(`✅ Table exists: ${tableExists}`);
    
    // Step 2: RLS permissions
    if (tableExists) {
      const canSelect = await DatabaseOperations.testRLSAccess(tableName, 'SELECT');
      const canInsert = await DatabaseOperations.testRLSAccess(tableName, 'INSERT');
      console.log(`✅ Can SELECT: ${canSelect}`);
      console.log(`✅ Can INSERT: ${canInsert}`);
    }
    
    return { tableExists };
  }

  // Protocol 2: Form-to-Database Flow Verification
  static verifyFormDatabaseFlow(
    formData: Record<string, any>,
    expectedDbFields: string[]
  ) {
    console.log(`🔍 TROUBLESHOOTING PROTOCOL: Form-to-Database Flow`);
    
    // Import field mapper
    const { FieldMapper } = require('./formValidationStandards');
    
    console.log('Original form data:', formData);
    
    const mappedData = FieldMapper.mapFormToDatabase(formData);
    console.log('Mapped database data:', mappedData);
    
    const missingFields = expectedDbFields.filter(field => !(field in mappedData));
    const extraFields = Object.keys(mappedData).filter(field => !expectedDbFields.includes(field));
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing required database fields:', missingFields);
    }
    
    if (extraFields.length > 0) {
      console.log('ℹ️ Extra fields (may be optional):', extraFields);
    }
    
    return {
      mappedData,
      missingFields,
      extraFields,
      isValid: missingFields.length === 0
    };
  }

  // Protocol 3: Error Classification and Response
  static classifyError(error: any): {
    type: 'database' | 'validation' | 'permission' | 'network' | 'unknown';
    suggested_action: string;
    investigation_steps: string[];
  } {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return {
        type: 'database',
        suggested_action: 'Check if table exists and migrations are applied',
        investigation_steps: [
          'Verify table exists in Supabase dashboard',
          'Check if migrations have been run',
          'Verify table name spelling and case'
        ]
      };
    }
    
    if (errorMessage.includes('row-level security') || errorMessage.includes('permission')) {
      return {
        type: 'permission',
        suggested_action: 'Check RLS policies and user authentication',
        investigation_steps: [
          'Verify user is authenticated',
          'Check RLS policies on target table',
          'Verify user has required permissions'
        ]
      };
    }
    
    if (errorMessage.includes('violates') || errorMessage.includes('constraint')) {
      return {
        type: 'validation',
        suggested_action: 'Check data validation and constraints',
        investigation_steps: [
          'Verify required fields are provided',
          'Check data types match schema',
          'Verify foreign key constraints'
        ]
      };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        type: 'network',
        suggested_action: 'Check network connectivity and Supabase status',
        investigation_steps: [
          'Verify internet connection',
          'Check Supabase project status',
          'Verify API keys are correct'
        ]
      };
    }
    
    return {
      type: 'unknown',
      suggested_action: 'Follow systematic debugging approach',
      investigation_steps: [
        'Check browser console for additional errors',
        'Verify complete error stack trace',
        'Test in isolation with minimal data'
      ]
    };
  }
}

// Mandatory pre-checks for any new card template or form
export const mandatoryPreChecks = {
  beforeCreatingForm: [
    'Verify target database table exists',
    'Test RLS policies with sample data',
    'Confirm field naming conventions match database',
    'Validate form schema against database schema'
  ],
  
  beforeSubmittingForm: [
    'Validate form data against schema',
    'Map form fields to database fields',
    'Test database connectivity',
    'Verify user authentication status'
  ],
  
  afterError: [
    'Classify error type using TroubleshootingProtocols.classifyError()',
    'Follow database-first investigation if applicable',
    'Check form-to-database flow mapping',
    'Test each component in isolation'
  ]
};
