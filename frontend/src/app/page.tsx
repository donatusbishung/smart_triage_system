"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketPriority, PRIORITY_LABELS } from "@/lib/types";
import { Send, ShieldCheck, Zap, Clock } from "lucide-react";

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      description: formData.get("description"),
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to submit ticket");
      }

      setSubmitted(true);
      toast.success("Ticket submitted successfully!", {
        description: `Auto-assigned to ${responseData.ticket.category} (${PRIORITY_LABELS[responseData.ticket.priority as TicketPriority] || responseData.ticket.priority} priority).`,
      });

      // Reset form after brief pause
      setTimeout(() => {
        setSubmitted(false);
        (e.target as HTMLFormElement).reset();
      }, 3000);
    } catch (err: any) {
      toast.error("Submission failed", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-brand-500 selection:text-white">

      {/* Top nav link */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">
            Smart<span className="text-black">Triage</span>
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          Agent Login
        </Link>
      </nav>

      {/* Main form card */}
      <Card className="relative z-10 w-full max-w-2xl bg-white border-white/20 shadow-2xl animate-fade-in-up mt-16">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Submit a{" "}
            <span className="text-black">Support Ticket</span>
          </CardTitle>
          <CardDescription className="text-base mt-2 max-w-md mx-auto">
            Describe your issue and our team will get back to you as soon as
            possible.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5" id="ticket-form">
            {/* Name & Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Alice Johnson"
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="alice@example.com"
                  required
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Subject row */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Brief description of the issue"
                required
                className="bg-background/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                rows={5}
                required
                className="bg-background/50 resize-none"
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              id="submit-ticket"
              disabled={isSubmitting || submitted}
              className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white shadow-lg hover:shadow-xl hover:shadow-brand-500/25 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Submitting…
                </span>
              ) : submitted ? (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Submitted!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Ticket
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
