import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, Profile, UserRole } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isHod: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole, additionalData?: Record<string, string>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHod, setIsHod] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data as Profile | null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const fetchIsHod = async (profileId: string) => {
    try {
      const { data } = await supabase
        .from("staff_members")
        .select("is_hod")
        .eq("profile_id", profileId)
        .single();
      return data?.is_hod === true;
    } catch {
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
      if (profileData?.role === "staff") {
        const hodStatus = await fetchIsHod(profileData.id);
        setIsHod(hodStatus);
      } else {
        setIsHod(false);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        if (profileData?.role === "staff") {
          const hodStatus = await fetchIsHod(profileData.id);
          setIsHod(hodStatus);
        } else {
          setIsHod(false);
        }
      } else {
        setProfile(null);
        setIsHod(false);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        if (profileData?.role === "staff") {
          const hodStatus = await fetchIsHod(profileData.id);
          setIsHod(hodStatus);
        }
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    additionalData?: Record<string, string>
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          email,
          full_name: fullName,
          role: role as any,
          department: additionalData?.department,
          roll_number: additionalData?.rollNumber,
          phone: additionalData?.phone,
        });

        if (profileError) throw profileError;

        // If staff role, create staff_members entry
        if (role === "staff") {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", data.user.id)
            .single();

          if (profileData) {
            await supabase.from("staff_members").insert({
              name: fullName,
              title: additionalData?.isHod === "true" ? "Head of Department" : "Staff",
              email,
              department: additionalData?.department,
              is_hod: additionalData?.isHod === "true",
              profile_id: profileData.id,
            });
          }
        }

        toast.success("Account created! You can now sign in.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsHod(false);
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isHod,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
