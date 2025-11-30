import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from "lucide-react";
import hbLogoWhite from "@/assets/hb-logo-white-new.png";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(2, { message: "Please enter your full name" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = () => {
    setErrors({});
    
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, confirmPassword, fullName });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      let message = "An error occurred during login";
      if (error.message.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Please confirm your email before logging in.";
      }
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });
    navigate("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      let message = "An error occurred during sign up";
      if (error.message.includes("User already registered")) {
        message = "This email is already registered. Please log in instead.";
      } else if (error.message.includes("Password should be")) {
        message = "Password does not meet requirements.";
      }
      toast({
        title: "Sign Up Failed",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Account Created!",
      description: "You can now log in with your credentials.",
    });
    setIsLogin(true);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-[#1a2e2a] via-[#2a3d3a] to-[#1a2e2a]">
        <Header />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
              {/* Header */}
                <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-8 text-center">
                <div className="flex justify-center mb-4">
                  <img 
                    src={hbLogoWhite} 
                    alt="Healing Buds" 
                    className="h-16 w-auto"
                  />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isLogin 
                    ? "Sign in to access your patient portal" 
                    : "Join Healing Buds for personalized care"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={isLogin ? handleLogin : handleSignup} className="p-8 space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-destructive text-xs">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-xs">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs">{errors.password}</p>
                  )}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-destructive text-xs">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isLogin ? "Sign In" : "Create Account"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                <div className="text-center pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setErrors({});
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      className="text-primary hover:underline ml-1 font-medium"
                      disabled={loading}
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Auth;
