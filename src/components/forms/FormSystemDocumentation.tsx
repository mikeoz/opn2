
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Documentation component for the form system standards
const FormSystemDocumentation = () => {
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Card Template & Form Development Standards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Mandatory Pre-Checks</h3>
            <div className="space-y-2">
              <Badge variant="outline">Database-First Approach</Badge>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Always verify database schema exists before writing forms</li>
                <li>Test database operations (triggers, functions) independently</li>
                <li>Use migrations to ensure consistent database state</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Field Naming Conventions</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Form Fields (camelCase):</strong>
                <ul className="list-disc list-inside">
                  <li>firstName, lastName</li>
                  <li>entityName</li>
                  <li>repFirstName, repLastName</li>
                  <li>cardName, cardDescription</li>
                </ul>
              </div>
              <div>
                <strong>Database Fields (snake_case):</strong>
                <ul className="list-disc list-inside">
                  <li>first_name, last_name</li>
                  <li>entity_name</li>
                  <li>rep_first_name, rep_last_name</li>
                  <li>name, description</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Error Troubleshooting Protocol</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li><Badge variant="destructive">Check database logs first</Badge> before modifying application code</li>
              <li>Verify table existence and RLS policies</li>
              <li>Test database triggers independently using SQL</li>
              <li>Verify form-to-database field mapping</li>
              <li>Test complete flow with sample data</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Required Utilities</h3>
            <div className="space-y-2 text-sm">
              <p><code>FieldMapper.mapFormToDatabase()</code> - Convert form data to database format</p>
              <p><code>DatabaseOperations.safeInsert()</code> - Insert with validation and error handling</p>
              <p><code>TroubleshootingProtocols.investigateDatabaseFirst()</code> - Systematic error investigation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormSystemDocumentation;
