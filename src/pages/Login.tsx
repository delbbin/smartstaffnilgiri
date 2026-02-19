import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Shield,
  Users,
  BookOpen,
  CalendarDays,
} from "lucide-react";
import { UserRole } from "@/lib/supabase";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, profile } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) { toast.error("Please enter your date of birth"); return; }
    setLoading(true);
    try {
      await signIn(email, dob);
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
      setIsSignUp(false);
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

  const roleIcons = { admin: Shield, staff: Users, student: BookOpen };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          {/* Login Form */}
          {!isSignUp ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  className="h-11 border-border bg-background rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-sm font-medium text-foreground">
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  className="h-11 border-border bg-background rounded-md"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[hsl(174,50%,42%)] hover:bg-[hsl(174,50%,36%)] text-white font-medium rounded-md"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline"
                >
                  Don't have an account?
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">I am a</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "staff", "student"] as UserRole[]).map((role) => {
                    const Icon = roleIcons[role];
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`p-2.5 rounded-md border transition-all flex flex-col items-center gap-1 text-xs font-medium capitalize ${
                          selectedRole === role
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-name" className="text-sm font-medium text-foreground">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Full Name"
                  className="h-11 border-border bg-background rounded-md"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Email"
                  className="h-11 border-border bg-background rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-dob" className="text-sm font-medium text-foreground">Date of Birth</Label>
                <Input
                  id="signup-dob"
                  type="date"
                  className="h-11 border-border bg-background rounded-md"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-phone" className="text-sm font-medium text-foreground">Phone</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="Phone"
                  className="h-11 border-border bg-background rounded-md"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {selectedRole === "student" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-roll" className="text-sm font-medium text-foreground">Roll Number</Label>
                    <Input
                      id="signup-roll"
                      type="text"
                      placeholder="Roll Number"
                      className="h-11 border-border bg-background rounded-md"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-dept" className="text-sm font-medium text-foreground">Department</Label>
                    <Input
                      id="signup-dept"
                      type="text"
                      placeholder="Department"
                      className="h-11 border-border bg-background rounded-md"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-[hsl(174,50%,42%)] hover:bg-[hsl(174,50%,36%)] text-white font-medium rounded-md"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>

              <div className="text-sm text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-primary hover:underline"
                >
                  Already have an account? Log in
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
