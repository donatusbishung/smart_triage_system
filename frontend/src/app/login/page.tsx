"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {  LogIn, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { setAuthToken } from "@/lib/fetchService";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setAuthToken(data.token);

      toast.success("Login successful!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      toast.error("Authentication failed", {
        description: err.message || "Please check your credentials.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-brand-500 selection:text-white">

      <Card className="relative z-10 w-full max-w-md bg-white border-white/20 shadow-2xl animate-fade-in-up">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Agent <span className="text-black">Login</span>
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Sign in to access the triage dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                placeholder="agent@smarttriage.com"
                required
                className="bg-background/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-background/50 h-11"
              />
            </div>

            <Button
              type="submit"
              id="login-submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white shadow-lg hover:shadow-xl hover:shadow-brand-500/25 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to submission form
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
