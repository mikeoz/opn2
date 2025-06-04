
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare user metadata based on account type
      const userMetadata: any = {
        account_type: userType,
      };

      if (userType === 'individual') {
        userMetadata.first_name = formData.firstName;
        userMetadata.last_name = formData.lastName;
      } else {
        userMetadata.entity_name = formData.entityName;
        userMetadata.rep_first_name = formData.repFirstName;
        userMetadata.rep_last_name = formData.repLastName;
        userMetadata.rep_email = formData.repEmail;
      }

      console.log('Attempting registration with metadata:', userMetadata);

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: userMetadata
        }
      });

      console.log('Registration response:', { data, error });

      if (error) {
        console.error('Registration error details:', error);
        throw error;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        toast({
          title: "Account created successfully!",
          description: userType === 'individual' 
            ? `Welcome ${formData.firstName}! Please check your email to confirm your account.`
            : `Welcome ${formData.entityName}! Please check your email to confirm your account.`,
        });
        // Don't navigate immediately, let user confirm email first
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                  <RadioGroupItem value="non_individual" id="non-individual" />
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
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="repFirstName">Representative First Name</Label>
                  <Input
                    id="repFirstName"
                    value={formData.repFirstName}
                    onChange={(e) => setFormData({...formData, repFirstName: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="repLastName">Representative Last Name</Label>
                  <Input
                    id="repLastName"
                    value={formData.repLastName}
                    onChange={(e) => setFormData({...formData, repLastName: e.target.value})}
                    required
                    disabled={loading}
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
                    disabled={loading}
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
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
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
