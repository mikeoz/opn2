import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsersRound, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MobileLayout from '@/components/MobileLayout';

const Groups = () => {
  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Groups</h1>
          <p className="text-sm text-muted-foreground">Create and manage your community groups</p>
        </div>

        {/* Create Group Button */}
        <Button className="w-full" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create New Group
        </Button>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Groups List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" />
              My Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <UsersRound className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No groups yet</p>
              <p className="text-sm mt-2">Create a group to start connecting with others</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Groups;
