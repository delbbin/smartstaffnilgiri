import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  LogIn,
  UserPlus,
} from "lucide-react";
import { UserRole } from "@/lib/supabase";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, profile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginDob, setLoginDob] = useState("");

  // Signup form state
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginDob) { toast.error("Please enter your date of birth"); return; }
    setLoading(true);
    try {
      await signIn(loginEmail, loginDob);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) { toast.error("Please enter your date of birth"); return; }
    setLoading(true);
    try {
      await signUp(email, dob, fullName, selectedRole, {
        phone,
        department,
        rollNumber,
        dateOfBirth: dob,
      });
      toast.success("Account created! You can now log in.");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (profile) {
    const redirectPath =
      profile.role === "admin" ? "/admin" :
      profile.role === "staff" ? "/staff" : "/student";
    navigate(redirectPath);
    return null;
  }

  const roleConfig = {
    admin: { icon: Shield, color: "text-destructive", bg: "bg-destructive/10", label: "Administrator" },
    staff: { icon: Users, color: "text-primary", bg: "bg-primary/10", label: "Staff Member" },
    student: { icon: BookOpen, color: "text-accent", bg: "bg-accent/10", label: "Student" },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold">Staff Availability Hub</h1>
            <p className="text-muted-foreground mt-1">Manage outpasses, meetings & staff availability</p>
          </div>

          <Card className="shadow-card border-border/50">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mx-0 rounded-b-none">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Welcome Back</CardTitle>
                  <CardDescription>Sign in with your email and date of birth</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-dob">Date of Birth (Password)</Label>
                      <Input
                        id="login-dob"
                        type="date"
                        value={loginDob}
                        onChange={(e) => setLoginDob(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Create Account</CardTitle>
                  <CardDescription>Select your role and fill in details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label>I am a</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["admin", "staff", "student"] as UserRole[]).map((role) => {
                          const config = roleConfig[role];
                          const Icon = config.icon;
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => setSelectedRole(role)}
                              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 text-xs font-medium capitalize ${
                                selectedRole === role
                                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                                  : "border-border hover:border-primary/40 text-muted-foreground"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${config.color}`} />
                              </div>
                              {config.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-dob">Date of Birth (used as password)</Label>
                      <Input
                        id="signup-dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone (optional)</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    {selectedRole === "student" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="signup-roll">Roll Number</Label>
                          <Input
                            id="signup-roll"
                            placeholder="CS2024001"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-dept">Department</Label>
                          <Input
                            id="signup-dept"
                            placeholder="Computer Science"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {(selectedRole === "staff" || selectedRole === "admin") && (
                      <div className="space-y-2">
                        <Label htmlFor="signup-dept-staff">Department</Label>
                        <Input
                          id="signup-dept-staff"
                          placeholder="Computer Science"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
