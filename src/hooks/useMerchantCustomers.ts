import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MerchantCustomer {
  id: string;
  merchant_id: string;
  customer_name: string;
  customer_email?: string | null;
  phone_number?: string | null;
  address: any;
  demographics: any;
  preferences: any;
  interaction_history: any[];
  total_interactions: number;
  last_interaction_at?: string | null;
  customer_status: string;
  data_completeness_score: number;
  created_at: string;
  updated_at: string;
}

export const useMerchantCustomers = (merchantId?: string) => {
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomers = async (merchantId: string) => {
    if (!merchantId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('merchant_customers')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast data to our interface to handle Json types
      const customers = (data || []).map(customer => ({
        ...customer,
        interaction_history: Array.isArray(customer.interaction_history) 
          ? customer.interaction_history 
          : [],
        address: customer.address || {},
        demographics: customer.demographics || {},
        preferences: customer.preferences || {},
        customer_status: customer.customer_status || 'prospect',
        total_interactions: customer.total_interactions || 0,
        data_completeness_score: customer.data_completeness_score || 0
      })) as MerchantCustomer[];
      
      setCustomers(customers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: Omit<MerchantCustomer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('merchant_customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      const newCustomer = {
        ...data,
        interaction_history: Array.isArray(data.interaction_history) 
          ? data.interaction_history 
          : [],
        address: data.address || {},
        demographics: data.demographics || {},
        preferences: data.preferences || {},
        customer_status: data.customer_status || 'prospect',
        total_interactions: data.total_interactions || 0,
        data_completeness_score: data.data_completeness_score || 0
      } as MerchantCustomer;

      setCustomers(prev => [newCustomer, ...prev]);
      toast({
        title: 'Success',
        description: 'Customer created successfully'
      });

      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<MerchantCustomer>) => {
    try {
      const { data, error } = await supabase
        .from('merchant_customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedCustomer = {
        ...data,
        interaction_history: Array.isArray(data.interaction_history) 
          ? data.interaction_history 
          : [],
        address: data.address || {},
        demographics: data.demographics || {},
        preferences: data.preferences || {},
        customer_status: data.customer_status || 'prospect',
        total_interactions: data.total_interactions || 0,
        data_completeness_score: data.data_completeness_score || 0
      } as MerchantCustomer;

      setCustomers(prev => prev.map(customer => 
        customer.id === id ? updatedCustomer : customer
      ));

      toast({
        title: 'Success',
        description: 'Customer updated successfully'
      });

      return updatedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('merchant_customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== id));
      toast({
        title: 'Success',
        description: 'Customer deleted successfully'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const getCustomersByStatus = (status: string) => {
    return customers.filter(customer => customer.customer_status === status);
  };

  const getCustomersWithEmail = () => {
    return customers.filter(customer => customer.customer_email);
  };

  const getCustomersWithoutEmail = () => {
    return customers.filter(customer => !customer.customer_email);
  };

  const getCustomerStats = () => {
    const total = customers.length;
    const withEmail = getCustomersWithEmail().length;
    const withoutEmail = getCustomersWithoutEmail().length;
    const byStatus = {
      prospect: getCustomersByStatus('prospect').length,
      active: getCustomersByStatus('active').length,
      inactive: getCustomersByStatus('inactive').length,
      vip: getCustomersByStatus('vip').length
    };

    const avgCompleteness = customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.data_completeness_score, 0) / customers.length
      : 0;

    return {
      total,
      withEmail,
      withoutEmail,
      byStatus,
      avgCompleteness: Math.round(avgCompleteness)
    };
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    if (merchantId) {
      fetchCustomers(merchantId);
    }
  }, [merchantId]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomersByStatus,
    getCustomersWithEmail,
    getCustomersWithoutEmail,
    getCustomerStats,
    refetch: () => merchantId && fetchCustomers(merchantId),
    totalCustomers: customers.length,
    recentCustomers: customers.slice(0, 5),
    formatTimeAgo
  };
};