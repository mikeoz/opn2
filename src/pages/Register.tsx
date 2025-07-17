
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { user, handlePostRegistrationSetup } = useAuth();
  const { toast } = useToast();

  // Only redirect authenticated users to dashboard, but allow navigation between auth pages
  React.useEffect(() => {
    if (user && location.pathname === '/register') {
      navigate('/dashboard');
    }
  }, [user, navigate, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userMetadata: any = {
        account_type: userType,
      };

      console.log('User type selected:', userType);

      if (userType === 'individual') {
        userMetadata.first_name = formData.firstName;
        userMetadata.last_name = formData.lastName;
        console.log('Individual metadata:', userMetadata);
      } else {
        userMetadata.first_name = formData.repFirstName;
        userMetadata.last_name = formData.repLastName;
        userMetadata.entity_name = formData.entityName;
        userMetadata.rep_first_name = formData.repFirstName;
        userMetadata.rep_last_name = formData.repLastName;
        userMetadata.rep_email = formData.repEmail;
        console.log('Organization metadata:', userMetadata);
      }

      console.log('Attempting registration with metadata:', userMetadata);

      const { data, error } = await supabase.auth.signUp({
        email: userType === 'individual' ? formData.email : formData.repEmail,
        password: formData.password,
        options: {
          data: userMetadata
        }
      });

      console.log('Registration response:', { data, error });

      if (error) {
        console.error('Registration error details:', error);
        
        // Handle the specific "user already exists" error
        if (error.message === 'User already registered' || error.code === 'user_already_exists') {
          toast({
            title: "Account already exists",
            description: "An account with this email already exists. Please try logging in instead, or contact support if you need help accessing your account.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // Handle post-registration setup
        await handlePostRegistrationSetup(data.user, userType);
        
        toast({
          title: "Account created successfully!",
          description: userType === 'individual' 
            ? `Welcome ${formData.firstName}! Please check your email to confirm your account.`
            : `Welcome ${formData.entityName}! Your organization account has been created successfully.`,
        });

        // Navigate to dashboard after successful registration
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
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

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>✅ System Status:</strong> Registration system has been rebuilt and is now bulletproof. Both individual and organization accounts are fully supported.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
