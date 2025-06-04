
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [userType, setUserType] = useState('individual');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    entityName: '',
    repFirstName: '',
    repLastName: '',
    repEmail: ''
  });
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual registration with GUID generation
    console.log('Registration:', { userType, ...formData });
    navigate('/dashboard');
  };

  const generateGUID = () => {
    // Generate 3 random letters + 7 random digits
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let guid = '';
    
    for (let i = 0; i < 3; i++) {
      guid += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 7; i++) {
      guid += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    
    return guid;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Opnli</CardTitle>
          <p className="text-gray-600">Create your community profile</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Account Type</Label>
              <RadioGroup value={userType} onValueChange={setUserType} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non-individual" id="non-individual" />
                  <Label htmlFor="non-individual">Non-Individual (Organization)</Label>
                </div>
              </RadioGroup>
            </div>

            {userType === 'individual' ? (
              <>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="entityName">Entity Name</Label>
                  <Input
                    id="entityName"
                    value={formData.entityName}
                    onChange={(e) => setFormData({...formData, entityName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="repFirstName">Representative First Name</Label>
                  <Input
                    id="repFirstName"
                    value={formData.repFirstName}
                    onChange={(e) => setFormData({...formData, repFirstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="repLastName">Representative Last Name</Label>
                  <Input
                    id="repLastName"
                    value={formData.repLastName}
                    onChange={(e) => setFormData({...formData, repLastName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="repEmail">Representative Email</Label>
                  <Input
                    id="repEmail"
                    type="email"
                    value={formData.repEmail}
                    onChange={(e) => setFormData({...formData, repEmail: e.target.value})}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/login')}>
              Already have an account? Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
