import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rss, Sparkles } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';

const Feeds = () => {
  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Curated Feeds</h1>
          <p className="text-sm text-muted-foreground">Stay connected with your network</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-2 border-dashed border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Rss className="h-5 w-5" />
              Social Media Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Sparkles className="h-20 w-20 mx-auto mb-4 text-primary opacity-30" />
              <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Pull in posts from social media shared by your connections. 
                Stay updated with curated content from your network.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Feeds;
