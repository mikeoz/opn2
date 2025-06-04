
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, User, Building } from 'lucide-react';

interface Participant {
  id: string;
  guid: string;
  name: string;
  type: 'individual' | 'non-individual';
  email: string;
  entityName?: string;
  representative?: {
    firstName: string;
    lastName: string;
  };
}

const Directory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mock participant data
  const [participants] = useState<Participant[]>([
    {
      id: '1',
      guid: 'ABC1234567',
      name: 'John Smith',
      type: 'individual',
      email: 'john.smith@email.com'
    },
    {
      id: '2',
      guid: 'DEF9876543',
      name: 'Jane Doe',
      type: 'individual',
      email: 'jane.doe@email.com'
    },
    {
      id: '3',
      guid: 'GHI5555555',
      name: 'Tech Solutions Inc',
      type: 'non-individual',
      email: 'contact@techsolutions.com',
      entityName: 'Tech Solutions Inc',
      representative: {
        firstName: 'Michael',
        lastName: 'Johnson'
      }
    },
    {
      id: '4',
      guid: 'JKL1111111',
      name: 'Sarah Wilson',
      type: 'individual',
      email: 'sarah.wilson@email.com'
    },
    {
      id: '5',
      guid: 'MNO9999999',
      name: 'Creative Agency LLC',
      type: 'non-individual',
      email: 'hello@creativeagency.com',
      entityName: 'Creative Agency LLC',
      representative: {
        firstName: 'Lisa',
        lastName: 'Chen'
      }
    }
  ]);

  const filteredParticipants = participants
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const individuals = filteredParticipants.filter(p => p.type === 'individual');
  const nonIndividuals = filteredParticipants.filter(p => p.type === 'non-individual');

  const ParticipantCard = ({ participant }: { participant: Participant }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {participant.type === 'individual' ? (
              <User className="h-5 w-5 text-blue-500" />
            ) : (
              <Building className="h-5 w-5 text-green-500" />
            )}
            <h3 className="font-semibold">{participant.name}</h3>
          </div>
          <Badge variant={participant.type === 'individual' ? 'default' : 'secondary'}>
            {participant.type === 'individual' ? 'Individual' : 'Organization'}
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
          <p>GUID: {participant.guid}</p>
          <p>Email: {participant.email}</p>
          {participant.representative && (
            <p>Rep: {participant.representative.firstName} {participant.representative.lastName}</p>
          )}
        </div>
        
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            View Profile
          </Button>
          <Button size="sm" className="flex-1">
            Share Card
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Directory</h1>
          <p className="text-gray-600">Browse and connect with community members</p>
        </div>

        {/* Search and Sort Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                Sort {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Directory Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">My Network ({filteredParticipants.length})</TabsTrigger>
            <TabsTrigger value="people">People ({individuals.length})</TabsTrigger>
            <TabsTrigger value="services">Services ({nonIndividuals.length})</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParticipants.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {individuals.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nonIndividuals.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Total Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{participants.length}</div>
                  <p className="text-sm text-gray-500">Active participants</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Individuals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{individuals.length}</div>
                  <p className="text-sm text-gray-500">Personal contacts</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Organizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{nonIndividuals.length}</div>
                  <p className="text-sm text-gray-500">Service providers</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {filteredParticipants.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Directory;
