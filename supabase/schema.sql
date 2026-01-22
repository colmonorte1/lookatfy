-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('client', 'expert', 'admin')) DEFAULT 'client',
  email TEXT
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- EXPERTS (Additional details for experts)
CREATE TABLE public.experts (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  title TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  consultation_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  city TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Experts
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Experts are viewable by everyone." ON public.experts FOR SELECT USING (true);
CREATE POLICY "Experts can update own details." ON public.experts FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Experts can insert own details." ON public.experts FOR INSERT WITH CHECK (auth.uid() = id);

-- SERVICES
CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  type TEXT CHECK (type IN ('Virtual', 'Presencial')) DEFAULT 'Virtual',
  includes TEXT[],
  not_includes TEXT[],
  requirements TEXT,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone." ON public.services FOR SELECT USING (true);
CREATE POLICY "Experts can manage own services." ON public.services FOR ALL USING (auth.uid() = expert_id);

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  meeting_url TEXT, -- Daily.co room URL
  price NUMERIC,
  currency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings." ON public.bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = expert_id);
CREATE POLICY "Users can create bookings." ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Experts can update bookings." ON public.bookings FOR UPDATE USING (auth.uid() = expert_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings." ON public.bookings FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- TRIGGER to auto-create profile on signup
-- (This function must be created in Supabase SQL Editor manually or via migration)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email, COALESCE(new.raw_user_meta_data->>'role', 'client'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- UPDATES FOR EXPERT PROFILE (Added 2026-01-17)
-- Run these commands in your Supabase SQL Editor to update the schema

-- 1. Add new columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.experts ADD CONSTRAINT experts_languages_array CHECK (jsonb_typeof(languages) = 'array');
ALTER TABLE public.experts ADD CONSTRAINT experts_skills_array CHECK (jsonb_typeof(skills) = 'array');

-- 2. Create Storage Bucket for Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (Allow public read, auth upload)
CREATE POLICY "Avatar images are publicly accessible." 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars." 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- 4. Create Storage Bucket for Service Images (Added for Service Cover)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Service Images Policies
CREATE POLICY "Service images are publicly accessible." 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'service-images');

CREATE POLICY "Experts can upload service images." 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Experts can update own service images."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'service-images');

-- 5. Add status column for Services (Soft Delete)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ADMIN POLICIES (Added 2026-01-17)
CREATE POLICY "Admins can update any profile." ON public.profiles FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update any expert." ON public.experts FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete any expert." ON public.experts FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 6. User Profile Updates (Phone, Country, City) - Added 2026-01-17
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- 7. Expert Availability (Weekly Schedule)
CREATE TABLE public.expert_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Availability
ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view availability." ON public.expert_availability FOR SELECT USING (true);
CREATE POLICY "Experts can manage own availability." ON public.expert_availability FOR ALL USING (auth.uid() = expert_id);


-- 7. Expert Exceptions (Specific Dates Off)
CREATE TABLE public.expert_exceptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Exceptions
ALTER TABLE public.expert_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view exceptions." ON public.expert_exceptions FOR SELECT USING (true);
CREATE POLICY "Experts can manage own exceptions." ON public.expert_exceptions FOR ALL USING (auth.uid() = expert_id);

-- 8. Platform Settings (Global Config)
CREATE TABLE public.platform_settings (
    id INTEGER PRIMARY KEY DEFAULT 1, -- Single row enforcement
    commission_percentage NUMERIC DEFAULT 10.0,
    min_withdrawal NUMERIC DEFAULT 50.0,
    currency TEXT DEFAULT 'USD',
    support_email TEXT DEFAULT 'soporte@lookatfy.com',
    auto_approve_services BOOLEAN DEFAULT false,
    auto_verify_experts BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT single_row CHECK (id = 1)
);

-- RLS for Settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Public read settings' ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY 'Admins update settings' ON public.platform_settings FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY 'Admins insert settings' ON public.platform_settings FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Initial Seed (optional, but good to have)
INSERT INTO public.platform_settings (id, commission_percentage)
VALUES (1, 10.0)
ON CONFLICT (id) DO NOTHING;

-- 9. Reviews System
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- The person being rated (Expert or User)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(booking_id, reviewer_id)
);

-- RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Admins delete reviews" ON public.reviews FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);


-- 10. Disputes System (Added 2026-01-18)
CREATE TABLE public.disputes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id), -- Who opened the dispute
    reason TEXT NOT NULL, -- "No show", "Technical issue", "Other"
    description TEXT NOT NULL, -- Detailed explanation
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved_refunded', 'resolved_dismissed')),
    admin_notes TEXT, -- Private notes for admin
    resolution_notes TEXT, -- Message sent to user upon resolution
    user_attachments TEXT[], -- Evidence uploaded by user
    expert_attachments TEXT[], -- Evidence uploaded by expert
    expert_response TEXT, -- Written response by expert within 24h
    user_response TEXT, -- Written response by user within 24h
    resolved_by UUID REFERENCES public.profiles(id), -- Admin who resolved
    resolved_at TIMESTAMP WITH TIME ZONE, -- When it was resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(booking_id) -- Only one dispute per booking
);

-- Ensure new response columns exist in existing databases
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS expert_response TEXT;
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS user_response TEXT;

-- RLS for Disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create disputes for their bookings" ON public.disputes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can view disputes" ON public.disputes
    FOR SELECT USING (
        auth.uid() = created_by 
        OR 
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = disputes.booking_id 
            AND (bookings.user_id = auth.uid() OR bookings.expert_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view all disputes" ON public.disputes
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can update disputes" ON public.disputes
    FOR UPDATE USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- Allow participants to update attachments within 24 hours of creation
CREATE POLICY "Participants can update attachments within 24h" ON public.disputes
    FOR UPDATE USING (
        (
            EXISTS (
                SELECT 1 FROM public.bookings 
                WHERE bookings.id = disputes.booking_id 
                AND (bookings.user_id = auth.uid() OR bookings.expert_id = auth.uid())
            )
        )
        AND (now() <= disputes.created_at + interval '24 hours')
    );

-- Storage bucket for disputes evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('disputes-evidence', 'disputes-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload under their own folder
CREATE POLICY "Auth can insert disputes evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'disputes-evidence' AND name LIKE (auth.uid()::text || '/%'));

CREATE POLICY "Auth can update own disputes evidence"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'disputes-evidence' AND name LIKE (auth.uid()::text || '/%'));
