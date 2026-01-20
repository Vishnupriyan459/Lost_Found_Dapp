import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import type { User } from "@/types";

// ---------------- ZOD Schema ----------------
const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["Student", "Staff", "Other"]),
    accountAddress: z.string().min(42, "Invalid account address"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface RegisterResponse {
  message: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    accountAddress: string;
    createdAt: string;
  };
}

type RegisterFormData = z.infer<typeof registerSchema>;

// ---------------- Component ----------------
export default function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const { address, isConnected } = useAccount();
  const API_URL = import.meta.env.VITE_API_URL;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "Student" },
  });

  // Auto-fill wallet address when connected
  useEffect(() => {
    if (address) setValue("accountAddress", address);
  }, [address, setValue]);

  // ---------------- Submit Handler ----------------
  const onSubmit = async (data: RegisterFormData) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          accountAddress: address,
        }),
      });

      const result: RegisterResponse = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Registration failed");
      }

      // Map backend → frontend User structure
      const user: User = {
        id: result.user._id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role as User["role"],
        accountAddress: result.user.accountAddress,
        createdAt: result.user.createdAt,
      };

      // Store user in Zustand
      login(user, "mock-token");

      toast({
        title: "Welcome to CampusFind!",
        description: result.message,
      });

      navigate("/Login");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="mt-2 text-muted-foreground">
            Join CampusFind and start earning rewards
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg space-y-6">
          {/* Wallet Connect */}
          <div>
            <Label className="mb-2 block">Connect Wallet</Label>

            {!isConnected ? (
              <div className="flex justify-center">
                <ConnectButton showBalance={false} />
              </div>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Wallet Connected</p>
                    <p className="text-xs text-green-600">{address}</p>
                  </div>
                </div>

                <ConnectButton.Custom>
                  {({ openAccountModal }) => (
                    <button
                      onClick={openAccountModal}
                      className="mt-3 w-full bg-yellow-500 text-white py-3 rounded-xl hover:bg-yellow-600 transition-colors font-medium"
                    >
                      Switch Wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              </>
            )}
          </div>

          {/* Form */}
          {isConnected && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    className="pl-10"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@campus.edu"
                    className="pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  defaultValue="Student"
                  onValueChange={(value) =>
                    setValue("role", value as "Student" | "Staff" | "Other")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...register("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Redirect */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?
            <Link to="/login" className="font-medium text-primary hover:underline">
              {" "}Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
