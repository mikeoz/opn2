import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAppLogs } from '@/utils/consoleBuffer';

interface DiagnosticsPanelProps {
  userEmail?: string | null;
  familyUnitsCount?: number;
  activeTab?: string;
  selectedFamilyUnitId?: string | null;
  channelStatus?: string;
}

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  userEmail,
  familyUnitsCount,
  activeTab,
  selectedFamilyUnitId,
  channelStatus,
}) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const debugEnabled = params.get('debug') === '1';

  if (!debugEnabled) return null;

  const logs = getAppLogs().slice(-20).reverse();

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[360px] max-w-[90vw]">
      <Card className="shadow-lg border-primary/30">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Diagnostics</div>
            <Badge variant="secondary">Debug</Badge>
          </div>

          <div className="text-xs space-y-1">
            <div>Route: <span className="font-mono">{location.pathname}{location.search}</span></div>
            {userEmail && (<div>User: <span className="font-mono">{userEmail}</span></div>)}
            {typeof familyUnitsCount === 'number' && (
              <div>Family Units: <span className="font-mono">{familyUnitsCount}</span></div>
            )}
            {activeTab && (<div>Active Tab: <span className="font-mono">{activeTab}</span></div>)}
            <div>Selected Family: <span className="font-mono">{selectedFamilyUnitId || 'none'}</span></div>
            {channelStatus && (<div>Realtime: <span className="font-mono">{channelStatus}</span></div>)}
          </div>

          <div className="max-h-48 overflow-auto rounded bg-muted/50 p-2 text-[10px] leading-snug border">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No recent logs</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="font-mono">
                  <span className="text-muted-foreground">[{new Date(log.ts).toLocaleTimeString()}]</span>{' '}
                  <span className={
                    log.level === 'error' ? 'text-destructive' :
                    log.level === 'warn' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-foreground'
                  }>
                    {log.level.toUpperCase()}: {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticsPanel;
