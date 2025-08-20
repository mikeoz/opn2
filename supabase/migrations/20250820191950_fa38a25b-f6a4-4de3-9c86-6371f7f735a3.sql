-- Create merchant_customers table for demo customer data
CREATE TABLE public.merchant_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  phone_number text,
  address jsonb DEFAULT '{}'::jsonb,
  demographics jsonb DEFAULT '{}'::jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  interaction_history jsonb DEFAULT '[]'::jsonb,
  total_interactions integer DEFAULT 0,
  last_interaction_at timestamp with time zone,
  customer_status text DEFAULT 'prospect', -- 'prospect', 'active', 'inactive', 'vip'
  data_completeness_score integer DEFAULT 0, -- 0-100 score
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on merchant_customers
ALTER TABLE public.merchant_customers ENABLE ROW LEVEL SECURITY;

-- Create policies for merchant_customers
CREATE POLICY "Merchants can manage their own customers"
ON public.merchant_customers
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.providers p 
  WHERE p.id = merchant_customers.merchant_id 
  AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.providers p 
  WHERE p.id = merchant_customers.merchant_id 
  AND p.user_id = auth.uid()
));

-- Create merchant_inventory table for demo inventory items
CREATE TABLE public.merchant_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_category text NOT NULL,
  description text,
  price_range text, -- 'low', 'medium', 'high', 'premium'
  availability_status text DEFAULT 'available', -- 'available', 'limited', 'out_of_stock'
  seasonal_info jsonb DEFAULT '{}'::jsonb,
  interaction_data jsonb DEFAULT '{}'::jsonb, -- track customer interactions
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on merchant_inventory
ALTER TABLE public.merchant_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for merchant_inventory
CREATE POLICY "Merchants can manage their own inventory"
ON public.merchant_inventory
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.providers p 
  WHERE p.id = merchant_inventory.merchant_id 
  AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.providers p 
  WHERE p.id = merchant_inventory.merchant_id 
  AND p.user_id = auth.uid()
));

-- Create demo_generation_jobs table to track generation jobs
CREATE TABLE public.demo_generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  merchant_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  job_type text NOT NULL, -- 'customers', 'inventory', 'interactions'
  generation_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_count integer DEFAULT 0,
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_details jsonb,
  export_file_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on demo_generation_jobs
ALTER TABLE public.demo_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for demo_generation_jobs
CREATE POLICY "Users can manage their own generation jobs"
ON public.demo_generation_jobs
FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Add indexes for better performance
CREATE INDEX idx_merchant_customers_merchant_id ON public.merchant_customers(merchant_id);
CREATE INDEX idx_merchant_customers_status ON public.merchant_customers(customer_status);
CREATE INDEX idx_merchant_customers_email ON public.merchant_customers(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX idx_merchant_inventory_merchant_id ON public.merchant_inventory(merchant_id);
CREATE INDEX idx_merchant_inventory_category ON public.merchant_inventory(item_category);
CREATE INDEX idx_demo_generation_jobs_merchant_id ON public.demo_generation_jobs(merchant_id);
CREATE INDEX idx_demo_generation_jobs_status ON public.demo_generation_jobs(status);