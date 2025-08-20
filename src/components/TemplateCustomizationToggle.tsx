import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Lock, Unlock } from 'lucide-react';
import { StandardCardTemplate } from '@/utils/standardTemplateUtils';

interface TemplateCustomizationToggleProps {
  template: StandardCardTemplate;
  showDetails?: boolean;
}

const TemplateCustomizationToggle: React.FC<TemplateCustomizationToggleProps> = ({
  template,
  showDetails = false
}) => {
  const { allow_recipient_modifications, sharing_permissions } = template;

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {allow_recipient_modifications ? (
          <Unlock className="h-3 w-3 text-green-600" />
        ) : (
          <Lock className="h-3 w-3 text-amber-600" />
        )}
        <span className={allow_recipient_modifications ? 'text-green-600' : 'text-amber-600'}>
          {allow_recipient_modifications ? 'Customizable' : 'Read-only'}
        </span>
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Sharing Settings</CardTitle>
        </div>
        <CardDescription className="text-xs">
          How recipients can interact with this template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-modifications" className="text-xs font-medium">
              Allow Customization
            </Label>
            <Switch
              id="allow-modifications"
              checked={allow_recipient_modifications}
              disabled
              className="scale-75"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {allow_recipient_modifications
              ? 'Recipients can modify fields and customize this template'
              : 'Recipients receive this template as read-only for consistency'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-sharing" className="text-xs font-medium">
              Allow Re-sharing
            </Label>
            <Switch
              id="allow-sharing"
              checked={sharing_permissions.can_share}
              disabled
              className="scale-75"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {sharing_permissions.can_share
              ? 'Recipients can share this template with others'
              : 'Template sharing is restricted to original distribution'}
          </p>
        </div>

        {allow_recipient_modifications && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Unlock className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Customizable Template
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-300">
              Recipients can personalize this template while maintaining the core structure.
            </p>
          </div>
        )}

        {!allow_recipient_modifications && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-3 w-3 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Protected Template
              </span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-300">
              Template structure is protected to ensure consistency across use cases.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateCustomizationToggle;