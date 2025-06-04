
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Share2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CardData {
  id: string;
  name: string;
  type: 'admin' | 'user';
  transactionCode: 'S' | 'N';
  fields: Array<{
    name: string;
    type: 'string' | 'image' | 'document';
    value?: any;
  }>;
}

const MyCards = () => {
  // Mock data for demonstration
  const [cards] = useState<CardData[]>([
    {
      id: '1A2B3C',
      name: 'Contact Information',
      type: 'admin',
      transactionCode: 'S',
      fields: [
        { name: 'Phone', type: 'string', value: '+1 (555) 123-4567' },
        { name: 'Address', type: 'string', value: '123 Main St, City, ST 12345' },
        { name: 'Profile Photo', type: 'image', value: null }
      ]
    },
    {
      id: '4D5E6F',
      name: 'Professional Services',
      type: 'user',
      transactionCode: 'S',
      fields: [
        { name: 'Service Description', type: 'string', value: 'Web Development Services' },
        { name: 'Portfolio', type: 'document', value: null },
        { name: 'Certifications', type: 'document', value: null }
      ]
    },
    {
      id: '7G8H9I',
      name: 'Emergency Contact',
      type: 'admin',
      transactionCode: 'N',
      fields: [
        { name: 'Emergency Contact Name', type: 'string', value: 'Jane Doe' },
        { name: 'Emergency Phone', type: 'string', value: '+1 (555) 987-6543' },
        { name: 'Relationship', type: 'string', value: 'Spouse' }
      ]
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My CARDs</h1>
            <p className="text-gray-600">Manage your information cards</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/cards/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/cards/create">
                <CreditCard className="h-4 w-4 mr-2" />
                Create Card
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{card.name}</CardTitle>
                  <div className="flex flex-col gap-1">
                    <Badge variant={card.type === 'admin' ? 'default' : 'secondary'}>
                      {card.type === 'admin' ? 'Admin' : 'Custom'}
                    </Badge>
                    <Badge variant={card.transactionCode === 'S' ? 'default' : 'destructive'}>
                      {card.transactionCode === 'S' ? 'Sharable' : 'Non-Sharable'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-500">ID: {card.id}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {card.fields.map((field, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-medium">{field.name}</span>
                      <span className="text-gray-500 capitalize">{field.type}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {card.transactionCode === 'S' && (
                    <Button size="sm" className="flex-1" asChild>
                      <Link to={`/cards/share/${card.id}`}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding or creating your first card</p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link to="/cards/add">Add Card</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/cards/create">Create Card</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCards;
