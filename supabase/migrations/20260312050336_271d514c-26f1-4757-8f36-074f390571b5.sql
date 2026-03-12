
-- Phase 1: Multi-tenant foundation

-- Organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  industry text DEFAULT 'education',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add organization_id to profiles (nullable for backward compatibility)
ALTER TABLE public.profiles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Organization members junction (for multi-org support)
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Departments table (org-scoped)
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  head_profile_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Custom roles table (org-scoped)
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS: Organizations - creators and members can view
CREATE POLICY "Anyone authenticated can view active organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Organization creator can manage"
  ON public.organizations FOR ALL TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all organizations"
  ON public.organizations FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- RLS: Organization members
CREATE POLICY "Members can view their org memberships"
  ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org creators can manage members"
  ON public.organization_members FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_members.organization_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can join organizations"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS: Departments
CREATE POLICY "Org members can view departments"
  ON public.departments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = departments.organization_id AND user_id = auth.uid()
  ));

CREATE POLICY "Org admins can manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = departments.organization_id AND created_by = auth.uid()
  ) OR is_admin(auth.uid()));

-- RLS: Custom roles
CREATE POLICY "Org members can view roles"
  ON public.custom_roles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = custom_roles.organization_id AND user_id = auth.uid()
  ));

CREATE POLICY "Org admins can manage roles"
  ON public.custom_roles FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = custom_roles.organization_id AND created_by = auth.uid()
  ) OR is_admin(auth.uid()));

-- Trigger for updated_at on organizations
CREATE TRIGGER handle_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
