import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Organization } from "@/lib/supabase";

export const useOrganization = () => {
  const { profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();

      if (!error && data) {
        setOrganization(data as Organization);
      }
      setLoading(false);
    };

    fetchOrg();
  }, [profile?.organization_id]);

  return { organization, loading };
};
