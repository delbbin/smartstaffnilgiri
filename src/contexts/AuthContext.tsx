import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, Profile, UserRole } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isHod: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    additionalData?: Record<string, string>,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "sinanulfarizi@gmail.com";
const VALID_ROLES: UserRole[] = ["admin", "staff", "student", "security"];

const isUserRole = (value: unknown): value is UserRole => {
  return typeof value === "string" && VALID_ROLES.includes(value as UserRole);
};

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
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return (data as Profile | null) ?? null;
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

  const resolveFallbackRole = (authUser: User): UserRole => {
    if (authUser.email?.toLowerCase() === ADMIN_EMAIL) {
      return "admin";
    }

    const metadataRole = authUser.user_metadata?.role;
    return isUserRole(metadataRole) ? metadataRole : "student";
  };

  const ensureProfile = async (authUser: User): Promise<Profile | null> => {
    const existingProfile = await fetchProfile(authUser.id);
    if (existingProfile) {
      return existingProfile;
    }

    if (!authUser.email) {
      console.error("Cannot create profile without email for user:", authUser.id);
      return null;
    }

    const metadataName = authUser.user_metadata?.full_name;
    const fullName =
      typeof metadataName === "string" && metadataName.trim().length > 0
        ? metadataName.trim()
        : authUser.email.split("@")[0];

    const { error } = await supabase.from("profiles").insert({
      user_id: authUser.id,
      email: authUser.email,
      full_name: fullName,
      role: resolveFallbackRole(authUser) as any,
      department:
        typeof authUser.user_metadata?.department === "string"
          ? authUser.user_metadata.department
          : null,
      roll_number:
        typeof authUser.user_metadata?.roll_number === "string"
          ? authUser.user_metadata.roll_number
          : null,
      phone:
        typeof authUser.user_metadata?.phone === "string"
          ? authUser.user_metadata.phone
          : null,
    });

    if (error) {
      console.error("Error creating missing profile:", error);
      return null;
    }

    return fetchProfile(authUser.id);
  };

  const loadUserState = async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      setIsHod(false);
      setLoading(false);
      return;
    }

    const profileData = await ensureProfile(authUser);
    setProfile(profileData);

    if (profileData?.role === "staff") {
      const hodStatus = await fetchIsHod(profileData.id);
      setIsHod(hodStatus);
    } else {
      setIsHod(false);
    }

    setLoading(false);
  };

  const refreshProfile = async () => {
    if (!user) return;

    setLoading(true);
    const profileData = await ensureProfile(user);
    setProfile(profileData);

    if (profileData?.role === "staff") {
      const hodStatus = await fetchIsHod(profileData.id);
      setIsHod(hodStatus);
    } else {
      setIsHod(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      const authUser = nextSession?.user ?? null;
      setUser(authUser);
      await loadUserState(authUser);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void syncSession(initialSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    additionalData?: Record<string, string>,
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            role,
            department: additionalData?.department ?? null,
            roll_number: additionalData?.rollNumber ?? null,
            phone: additionalData?.phone ?? null,
            is_hod: additionalData?.isHod === "true",
          },
        },
      });

      if (error) throw error;

      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          email,
          full_name: fullName,
          role: role as any,
          department: additionalData?.department,
          roll_number: additionalData?.rollNumber,
          phone: additionalData?.phone,
        });

        if (profileError) {
          console.error("Profile creation on signup failed, will be retried on login:", profileError);
        }

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
      }

      if (!data.session) {
        toast.success("Account created! Please verify your email before signing in.");
        return;
      }

      toast.success("Account created! You can now sign in.");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
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