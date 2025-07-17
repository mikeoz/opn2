
import { supabase } from '@/integrations/supabase/client';
import { DatabaseOperations } from './databaseOperationStandards';

export class TroubleshootingProtocols {
  // Database-first investigation approach
  static async investigateDatabaseFirst(tableName: string, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE') {
    console.log(`🔍 Investigating database readiness for ${tableName} (${operation})`);
    
    const investigation = {
      tableExists: false,
      hasRLSPermission: false,
      canPerformOperation: false,
      errors: [] as string[]
    };

    try {
      // Step 1: Check if table exists
      investigation.tableExists = await DatabaseOperations.verifyTableExists(tableName);
      if (!investigation.tableExists) {
        investigation.errors.push(`Table ${tableName} does not exist or is not accessible`);
        return investigation;
      }

      // Step 2: Test RLS permissions
      investigation.hasRLSPermission = await DatabaseOperations.testRLSAccess(tableName, operation);
      if (!investigation.hasRLSPermission) {
        investigation.errors.push(`No ${operation} permission on ${tableName} due to RLS policies`);
      }

      // Step 3: Mark as ready if all checks pass
      investigation.canPerformOperation = investigation.tableExists && investigation.hasRLSPermission;

      console.log(`✅ Database investigation complete for ${tableName}:`, investigation);
      return investigation;

    } catch (error: any) {
      investigation.errors.push(`Database investigation failed: ${error.message}`);
      console.error(`❌ Database investigation failed for ${tableName}:`, error);
      return investigation;
    }
  }

  // Error classification system
  static classifyError(error: any): 'database' | 'validation' | 'permissions' | 'network' | 'unknown' {
    if (!error) return 'unknown';
    
    const errorMessage = error.message || error.toString();
    
    // Database errors
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return 'database';
    }
    
    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
      return 'permissions';
    }
    
    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('required') || errorMessage.includes('invalid')) {
      return 'validation';
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return 'network';
    }
    
    return 'unknown';
  }

  // Systematic debugging checklist
  static async runDiagnostics(tableName: string, formData: Record<string, any>) {
    console.log(`🔬 Running full diagnostics for ${tableName}`);
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      tableName,
      formData,
      results: {
        tableExists: false,
        selectPermission: false,
        insertPermission: false,
        fieldMappingWorks: false,
        validationPasses: false
      },
      errors: [] as string[],
      recommendations: [] as string[]
    };

    try {
      // Test table existence
      diagnostics.results.tableExists = await DatabaseOperations.verifyTableExists(tableName);
      if (!diagnostics.results.tableExists) {
        diagnostics.errors.push(`Table ${tableName} does not exist`);
        diagnostics.recommendations.push(`Create table ${tableName} in database`);
      }

      // Test permissions
      diagnostics.results.selectPermission = await DatabaseOperations.testRLSAccess(tableName, 'SELECT');
      diagnostics.results.insertPermission = await DatabaseOperations.testRLSAccess(tableName, 'INSERT');
      
      if (!diagnostics.results.selectPermission) {
        diagnostics.errors.push(`No SELECT permission on ${tableName}`);
        diagnostics.recommendations.push(`Check RLS policies for SELECT on ${tableName}`);
      }
      
      if (!diagnostics.results.insertPermission) {
        diagnostics.errors.push(`No INSERT permission on ${tableName}`);
        diagnostics.recommendations.push(`Check RLS policies for INSERT on ${tableName}`);
      }

      // Test field mapping
      try {
        const { FieldMapper } = await import('./formValidationStandards');
        FieldMapper.mapFormToDatabase(formData);
        diagnostics.results.fieldMappingWorks = true;
      } catch (err: any) {
        diagnostics.errors.push(`Field mapping failed: ${err.message}`);
        diagnostics.recommendations.push(`Review field mapping configuration`);
      }

      console.log(`📊 Diagnostics complete for ${tableName}:`, diagnostics);
      return diagnostics;

    } catch (error: any) {
      diagnostics.errors.push(`Diagnostics failed: ${error.message}`);
      console.error(`❌ Diagnostics failed for ${tableName}:`, error);
      return diagnostics;
    }
  }

  // Generate troubleshooting report
  static generateTroubleshootingReport(diagnostics: any) {
    const report = {
      summary: diagnostics.errors.length === 0 ? 'All systems operational' : `${diagnostics.errors.length} issues found`,
      criticalIssues: diagnostics.errors.filter((err: string) => err.includes('does not exist') || err.includes('permission')),
      recommendations: diagnostics.recommendations,
      nextSteps: [] as string[]
    };

    // Generate next steps based on findings
    if (!diagnostics.results.tableExists) {
      report.nextSteps.push('1. Create missing database table');
    }
    
    if (!diagnostics.results.selectPermission || !diagnostics.results.insertPermission) {
      report.nextSteps.push('2. Review and update RLS policies');
    }
    
    if (!diagnostics.results.fieldMappingWorks) {
      report.nextSteps.push('3. Fix field mapping configuration');
    }
    
    if (report.nextSteps.length === 0) {
      report.nextSteps.push('System is ready for operations');
    }

    return report;
  }
}
