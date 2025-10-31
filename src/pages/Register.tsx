
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const [userType, setUserType] = useState('individual');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationName: ''
  });
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handlePostRegistrationSetup } = useAuth();
  const { toast } = useToast();

  // Check for invitation token in URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const invitationToken = searchParams.get('invitation');
    
    if (invitationToken) {
      // If user is logged in when accessing invitation, sign them out
      if (user) {
        toast({
          title: "Signing out",
          description: "You need to sign out to accept this invitation for another user.",
        });
        supabase.auth.signOut().then(() => {
          // Reload to clear state after sign out
          window.location.reload();
        });
        return;
      }

      // Fetch invitation details
      const fetchInvitation = async () => {
        try {
          const { data, error } = await supabase
            .from('family_invitations')
            .select('*')
            .eq('invitation_token', invitationToken)
            .eq('status', 'pending')
            .single();

          if (error || !data) {
            toast({
              title: "Invalid Invitation",
              description: "This invitation link is invalid or has expired.",
              variant: "destructive",
            });
            return;
          }

          // Check if invitation is expired
          if (new Date(data.expires_at) < new Date()) {
            toast({
              title: "Expired Invitation",
              description: "This invitation has expired. Please request a new one.",
              variant: "destructive",
            });
            return;
          }

          setInvitationData(data);
          setFormData(prev => ({
            ...prev,
            email: data.invitee_email,
            firstName: data.invitee_name?.split(' ')[0] || '',
            lastName: data.invitee_name?.split(' ').slice(1).join(' ') || '',
          }));
          setUserType('individual'); // Force individual type for family invitations
        } catch (error) {
          console.error('Error fetching invitation:', error);
          toast({
            title: "Error",
            description: "Failed to load invitation details.",
            variant: "destructive",
          });
        }
      };

      fetchInvitation();
    }
  }, [location.search, toast, user]);

  // Only redirect authenticated users to dashboard if NO invitation token
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hasInvitation = searchParams.get('invitation');
    
    // Don't redirect if there's an invitation token (handled above)
    if (user && location.pathname === '/register' && !hasInvitation) {
      navigate('/dashboard');
    }
  }, [user, navigate, location.pathname, location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            account_type: userType,
            organization_name: userType === 'non_individual' ? formData.organizationName : null,
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        throw error;
      }

      if (data.user) {
        await handleInvitationAcceptance(data.user);
        await handlePostRegistrationSetup(data.user, userType);
        
        toast({
          title: "Registration successful!",
          description: invitationData 
            ? "Please check your email to verify your account and complete the process."
            : "Please check your email to verify your account.",
        });
        
        // Redirect to family management if invitation, otherwise dashboard
        if (invitationData) {
          navigate('/family-management');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await handleInvitationAcceptance(data.user);
        
        toast({
          title: "Welcome back!",
          description: invitationData 
            ? "You've successfully joined the family unit."
            : "You've been signed in successfully.",
        });
        
        // Redirect to family management if invitation, otherwise dashboard
        if (invitationData) {
          navigate('/family-management');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationAcceptance = async (user: any) => {
    if (!invitationData) return;

    try {
      // Call the edge function to accept the invitation with proper permissions
      const { data, error } = await supabase.functions.invoke('accept-family-invitation', {
        body: {
          invitationToken: invitationData.invitation_token
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('Invitation accepted successfully:', data);
    } catch (inviteError: any) {
      console.error('Error accepting invitation:', inviteError);
      toast({
        title: "Invitation Error",
        description: inviteError.message || "There was an issue joining the family unit. Please contact the inviter.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {invitationData ? 'Accept Family Invitation' : 'Join Opnli'}
          </CardTitle>
          <CardDescription>
            {invitationData ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>You've been invited to join a family unit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{invitationData.relationship_role}</Badge>
                </div>
                {invitationData.personal_message && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <em>"{invitationData.personal_message}"</em>
                  </div>
                )}
              </div>
            ) : (
              'Create your community profile'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationData && (
            <div className="mb-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Do you already have an account or need to create a new one?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={showSignIn ? "default" : "outline"} 
                    onClick={() => {
                      setShowSignIn(true);
                      setSignInData(prev => ({ ...prev, email: invitationData.invitee_email }));
                    }}
                    className="h-auto py-3 px-4"
                  >
                    <div className="text-center">
                      <div className="font-medium">Sign In</div>
                      <div className="text-xs opacity-75">I have an account</div>
                    </div>
                  </Button>
                  <Button 
                    variant={!showSignIn ? "default" : "outline"} 
                    onClick={() => setShowSignIn(false)}
                    className="h-auto py-3 px-4"
                  >
                    <div className="text-center">
                      <div className="font-medium">Create Account</div>
                      <div className="text-xs opacity-75">I'm new here</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {invitationData && showSignIn ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signInEmail">Email</Label>
                <Input
                  id="signInEmail"
                  type="email"
                  value={signInData.email}
                  onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="signInPassword">Password</Label>
                <Input
                  id="signInPassword"
                  type="password"
                  value={signInData.password}
                  onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Accept Invitation & Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!invitationData && (
                <div>
                  <Label>Account Type</Label>
                  <RadioGroup value={userType} onValueChange={setUserType} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual">Individual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non_individual" id="non-individual" />
                      <Label htmlFor="non-individual">Organization</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {userType === 'non_individual' && !invitationData && (
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="firstName">
                  {userType === 'individual' ? 'First Name' : 'Representative First Name'}
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="lastName">
                  {userType === 'individual' ? 'Last Name' : 'Representative Last Name'}
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email">
                  {userType === 'individual' ? 'Email' : 'Representative Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={loading || !!invitationData} // Disable if from invitation
                />
              </div>

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
                {loading ? 'Creating Account...' : (invitationData ? 'Accept Invitation & Create Account' : 'Create Account')}
              </Button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/login')}>
              Already have an account? Sign in
            </Button>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>✅ System Status:</strong> Registration system simplified and unified. Single form now handles both individual and organization accounts with clean field structure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
