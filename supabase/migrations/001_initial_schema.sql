-- ============================================================================
-- NET-LAB 2.0 Enterprise Networking Platform Database Schema
-- Production PostgreSQL schema with Row-Level Security (RLS) policies
-- Author: Built by Sandesh Bajgai for NET-LAB
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'educator', 'engineer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Projects & Network Architectures
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Building', 'Testing', 'Completed')),
    requirements JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Topologies
CREATE TABLE IF NOT EXISTS public.topologies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Custom LAN',
    devices JSONB NOT NULL DEFAULT '[]'::jsonb,
    connections JSONB NOT NULL DEFAULT '[]'::jsonb,
    vlans JSONB DEFAULT '[]'::jsonb,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Device Inventory Table (Normalized)
CREATE TABLE IF NOT EXISTS public.device_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hostname TEXT NOT NULL,
    device_type TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    management_ip INET,
    mac_address MACADDR,
    location TEXT,
    vlan_id INTEGER,
    status TEXT DEFAULT 'up' CHECK (status IN ('up', 'down', 'warning')),
    serial_number TEXT,
    rack_unit TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. IPAM Networks & Subnets
CREATE TABLE IF NOT EXISTS public.ipam_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    vlan_id INTEGER,
    network_cidr CIDR NOT NULL,
    gateway_ip INET NOT NULL,
    dhcp_start INET,
    dhcp_end INET,
    security_zone TEXT DEFAULT 'Internal',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. IP Allocations
CREATE TABLE IF NOT EXISTS public.ip_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network_id UUID REFERENCES public.ipam_networks(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    device_id UUID REFERENCES public.device_inventory(id) ON DELETE SET NULL,
    hostname TEXT,
    mac_address MACADDR,
    status TEXT DEFAULT 'used' CHECK (status IN ('used', 'available', 'reserved')),
    purpose TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. VLAN Planner Table
CREATE TABLE IF NOT EXISTS public.vlans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    vlan_id INTEGER NOT NULL CHECK (vlan_id >= 1 AND vlan_id <= 4094),
    name TEXT NOT NULL,
    purpose TEXT,
    subnet_cidr CIDR NOT NULL,
    gateway_ip INET NOT NULL,
    security_zone TEXT DEFAULT 'Internal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (project_id, vlan_id)
);

-- 8. Project Snapshots & Version History
CREATE TABLE IF NOT EXISTS public.project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    topology_snapshot JSONB NOT NULL,
    ipam_snapshot JSONB,
    vlan_snapshot JSONB,
    inventory_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Practical Lab Attempts & User Progress
CREATE TABLE IF NOT EXISTS public.lab_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lab_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    completed BOOLEAN DEFAULT false,
    duration_seconds INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. User Progress & Badges
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    learning_streak_days INTEGER DEFAULT 1,
    unlocked_skills JSONB DEFAULT '[]'::jsonb,
    earned_achievements JSONB DEFAULT '[]'::jsonb,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipam_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vlans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: Users manage their own projects
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- Topologies: Users manage their own topologies
CREATE POLICY "Users can manage own topologies" ON public.topologies FOR ALL USING (auth.uid() = user_id);

-- Lab Attempts: Users view/insert their own attempts
CREATE POLICY "Users can view own lab attempts" ON public.lab_attempts FOR ALL USING (auth.uid() = user_id);

-- User Progress: Users view/update own progress
CREATE POLICY "Users can manage own progress" ON public.user_progress FOR ALL USING (auth.uid() = user_id);
