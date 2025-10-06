import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, User } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';

const Peeps = () => {
  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Peeps Quiz</h1>
          <p className="text-sm text-muted-foreground">Test your knowledge of your connections</p>
        </div>

        {/* Quiz Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
              Who Is This?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {/* Profile Photo Placeholder */}
              <Avatar className="h-40 w-40 mx-auto mb-6">
                <AvatarImage src="" />
                <AvatarFallback className="bg-muted">
                  <User className="h-20 w-20 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              {/* Quiz Options Placeholder */}
              <div className="space-y-3 max-w-sm mx-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  No connections available for quiz yet
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Option A
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Option B
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Option C
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Option D
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Correct Answer
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                Connect with people to start playing!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Peeps;
