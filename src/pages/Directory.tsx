
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MobileLayout from '@/components/MobileLayout';

const Directory = () => {
  return (
    <MobileLayout>
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Community Directory</h1>
          <p className="text-muted-foreground">Discover and connect with community members</p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search directory..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Directory Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Directory features coming soon</p>
              <p className="text-sm">Connect with community members and discover shared interests</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Directory;
