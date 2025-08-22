
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import MobileLayout from '@/components/MobileLayout';

const Directory = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Demo community members for preview
  const demoMembers = [
    {
      id: '1',
      name: 'Sarah Chen',
      interests: ['Organic Gardening', 'Local Food'],
      location: 'Neighborhood A',
      cardTypes: ['Passion', 'Purpose'],
      memberSince: 'March 2024'
    },
    {
      id: '2', 
      name: 'Mike Johnson',
      interests: ['Home Repair', 'Tool Sharing'],
      location: 'Neighborhood B',
      cardTypes: ['Skill', 'Purpose'],
      memberSince: 'January 2024'
    },
    {
      id: '3',
      name: 'Local Bakery Co-op',
      interests: ['Fresh Bread', 'Community Events'],
      location: 'Main Street',
      cardTypes: ['Organization', 'Place'],
      memberSince: 'February 2024'
    }
  ];

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-foreground">Community Directory</h1>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">
                  <strong>Demo Mode:</strong> Sample community members shown. 
                  In Alpha Testing, you'll see real neighbors and local connections.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground">Discover and connect with community members</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, interest, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-touch-friendly"
              />
            </div>
          </CardContent>
        </Card>

        {/* Directory Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-benefit" />
              Community Members
              <Badge variant="secondary" className="bg-benefit/10 text-benefit">
                {demoMembers.length} Demo
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoMembers
                .filter(member => 
                  !searchQuery || 
                  member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  member.interests.some(interest => 
                    interest.toLowerCase().includes(searchQuery.toLowerCase())
                  ) ||
                  member.location.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((member) => (
                <div 
                  key={member.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-all touch-manipulation min-h-touch-target"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-benefit truncate">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.location}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      Since {member.memberSince}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Interests:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Card Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.cardTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {searchQuery && demoMembers.filter(member => 
                member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.interests.some(interest => 
                  interest.toLowerCase().includes(searchQuery.toLowerCase())
                ) ||
                member.location.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No members found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Directory;
