
import { useState } from 'react';
import { validateCardTemplateForm } from '@/utils/formValidationStandards';
import { DatabaseOperations } from '@/utils/databaseOperationStandards';
import { TroubleshootingProtocols } from '@/utils/troubleshootingProtocols';

// Hook that enforces standards for card template operations
export const useCardTemplateStandards = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const createCardTemplate = async (formData: any) => {
    setIsValidating(true);
    setErrors([]);

    try {
      console.log('🚀 Starting card template creation with standards enforcement');
      
      // Step 1: Investigate database first
      const investigation = await TroubleshootingProtocols.investigateDatabaseFirst(
        'card_templates', 
        'INSERT'
      );
      
      if (!investigation.tableExists) {
        throw new Error('card_templates table does not exist or is not accessible');
      }

      // Step 2: Validate form data
      const validation = validateCardTemplateForm(formData);
      if (!validation.success) {
        const validationErrors = validation.error?.errors?.map((err: any) => err.message) || ['Validation failed'];
        setErrors(validationErrors);
        return { success: false, errors: validationErrors };
      }

      // Step 3: Test complete flow before actual insert
      const flowTest = await DatabaseOperations.testCompleteFlow(
        'card_templates',
        formData,
        validateCardTemplateForm
      );

      if (!flowTest.success) {
        setErrors(flowTest.errors);
        return { success: false, errors: flowTest.errors };
      }

      // Step 4: Perform safe insert
      const result = await DatabaseOperations.safeInsert(
        'card_templates',
        formData,
        validateCardTemplateForm
      );

      if (result.error) {
        // Classify the error for better debugging
        const errorClassification = TroubleshootingProtocols.classifyError(result.error);
        console.error('Card template creation failed:', {
          error: result.error,
          classification: errorClassification
        });
        
        setErrors([result.error]);
        return { success: false, errors: [result.error], classification: errorClassification };
      }

      console.log('✅ Card template created successfully with standards compliance');
      return { success: true, data: result.data };

    } catch (error: any) {
      const errorClassification = TroubleshootingProtocols.classifyError(error);
      console.error('Unexpected error in card template creation:', {
        error,
        classification: errorClassification
      });
      
      setErrors([error.message]);
      return { success: false, errors: [error.message], classification: errorClassification };
    } finally {
      setIsValidating(false);
    }
  };

  const testDatabaseReadiness = async (tableName: string) => {
    return await TroubleshootingProtocols.investigateDatabaseFirst(tableName, 'INSERT');
  };

  return {
    createCardTemplate,
    testDatabaseReadiness,
    isValidating,
    errors,
    clearErrors: () => setErrors([])
  };
};
