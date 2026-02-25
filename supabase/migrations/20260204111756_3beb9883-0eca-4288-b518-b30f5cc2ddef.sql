-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'freelancer');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Create enum for bid status
CREATE TYPE public.bid_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- Create enum for escrow status
CREATE TYPE public.escrow_status AS ENUM ('pending', 'held', 'released', 'refunded');

-- Create enum for withdrawal status
CREATE TYPE public.withdrawal_status AS ENUM ('requested', 'processing', 'completed', 'failed');

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('stripe', 'mpesa');

-- =============================================
-- USER ROLES TABLE (separate from profiles for security)
-- =============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'freelancer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    phone TEXT,
    skills TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TASKS TABLE
-- =============================================
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    budget DECIMAL(12,2) NOT NULL CHECK (budget > 0),
    deadline TIMESTAMP WITH TIME ZONE,
    status task_status NOT NULL DEFAULT 'open',
    accepted_bid_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BIDS TABLE
-- =============================================
CREATE TABLE public.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    freelancer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    proposal TEXT NOT NULL,
    status bid_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (task_id, freelancer_id)
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Add foreign key for accepted_bid_id after bids table is created
ALTER TABLE public.tasks ADD CONSTRAINT fk_accepted_bid FOREIGN KEY (accepted_bid_id) REFERENCES public.bids(id);

-- =============================================
-- WALLETS TABLE
-- =============================================
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    available_balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
    pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TRANSACTIONS TABLE (for escrow tracking)
-- =============================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    payer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    payee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    platform_fee DECIMAL(12,2) DEFAULT 0,
    payment_method payment_method NOT NULL,
    escrow_status escrow_status NOT NULL DEFAULT 'pending',
    external_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- WITHDRAWALS TABLE
-- =============================================
CREATE TABLE public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    method payment_method NOT NULL,
    status withdrawal_status NOT NULL DEFAULT 'requested',
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PLATFORM SETTINGS TABLE
-- =============================================
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 10 CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
    min_withdrawal DECIMAL(12,2) NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS (Security Definer)
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Check if current user is client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'client')
$$;

-- Check if current user is freelancer
CREATE OR REPLACE FUNCTION public.is_freelancer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'freelancer')
$$;

-- Check if user owns a task
CREATE OR REPLACE FUNCTION public.is_task_owner(_task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE id = _task_id
      AND client_id = auth.uid()
  )
$$;

-- Check if user owns a bid
CREATE OR REPLACE FUNCTION public.is_bid_owner(_bid_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bids
    WHERE id = _bid_id
      AND freelancer_id = auth.uid()
  )
$$;

-- =============================================
-- RLS POLICIES FOR USER_ROLES
-- =============================================
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_admin());

-- =============================================
-- RLS POLICIES FOR PROFILES
-- =============================================
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- =============================================
-- RLS POLICIES FOR CATEGORIES
-- =============================================
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage categories"
ON public.categories FOR ALL
USING (public.is_admin());

-- =============================================
-- RLS POLICIES FOR TASKS
-- =============================================
CREATE POLICY "Open tasks are viewable by everyone"
ON public.tasks FOR SELECT
USING (
  status = 'open' 
  OR client_id = auth.uid() 
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.bids 
    WHERE bids.task_id = tasks.id 
    AND bids.freelancer_id = auth.uid()
  )
);

CREATE POLICY "Clients can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (client_id = auth.uid() AND public.is_client());

CREATE POLICY "Task owners and admins can update tasks"
ON public.tasks FOR UPDATE
USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "Task owners and admins can delete tasks"
ON public.tasks FOR DELETE
USING (client_id = auth.uid() OR public.is_admin());

-- =============================================
-- RLS POLICIES FOR BIDS
-- =============================================
CREATE POLICY "Users can view relevant bids"
ON public.bids FOR SELECT
USING (
  freelancer_id = auth.uid()
  OR public.is_task_owner(task_id)
  OR public.is_admin()
);

CREATE POLICY "Freelancers can create bids on open tasks"
ON public.bids FOR INSERT
WITH CHECK (
  freelancer_id = auth.uid() 
  AND public.is_freelancer()
  AND EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_id 
    AND tasks.status = 'open'
  )
);

CREATE POLICY "Bid owners can update their bids"
ON public.bids FOR UPDATE
USING (freelancer_id = auth.uid() OR public.is_admin() OR public.is_task_owner(task_id));

CREATE POLICY "Bid owners and admins can delete bids"
ON public.bids FOR DELETE
USING (freelancer_id = auth.uid() OR public.is_admin());

-- =============================================
-- RLS POLICIES FOR WALLETS
-- =============================================
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "System creates wallets"
ON public.wallets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only admins can update wallets"
ON public.wallets FOR UPDATE
USING (public.is_admin());

-- =============================================
-- RLS POLICIES FOR TRANSACTIONS
-- =============================================
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (
  payer_id = auth.uid() 
  OR payee_id = auth.uid() 
  OR public.is_admin()
);

CREATE POLICY "Clients can create transactions"
ON public.transactions FOR INSERT
WITH CHECK (payer_id = auth.uid());

CREATE POLICY "Only admins can update transactions"
ON public.transactions FOR UPDATE
USING (public.is_admin());

-- =============================================
-- RLS POLICIES FOR WITHDRAWALS
-- =============================================
CREATE POLICY "Users can view own withdrawals"
ON public.withdrawals FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Freelancers can create withdrawals"
ON public.withdrawals FOR INSERT
WITH CHECK (user_id = auth.uid() AND public.is_freelancer());

CREATE POLICY "Only admins can update withdrawals"
ON public.withdrawals FOR UPDATE
USING (public.is_admin());

-- =============================================
-- RLS POLICIES FOR PLATFORM SETTINGS
-- =============================================
CREATE POLICY "Everyone can view platform settings"
ON public.platform_settings FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage platform settings"
ON public.platform_settings FOR ALL
USING (public.is_admin());

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
BEFORE UPDATE ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from user metadata or default to freelancer
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'freelancer'
  );
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Create wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default platform settings
INSERT INTO public.platform_settings (fee_percentage, min_withdrawal)
VALUES (10, 10);

-- Insert default categories
INSERT INTO public.categories (name, description, icon) VALUES
('Web Development', 'Website and web application development', 'Globe'),
('Mobile Development', 'iOS and Android app development', 'Smartphone'),
('Design', 'Graphic design, UI/UX, and branding', 'Palette'),
('Writing', 'Content writing, copywriting, and editing', 'PenTool'),
('Marketing', 'Digital marketing and SEO', 'TrendingUp'),
('Data Entry', 'Data entry and administrative tasks', 'Database'),
('Video & Animation', 'Video editing and animation', 'Video'),
('Virtual Assistant', 'Administrative and personal assistance', 'Headphones');