export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketCategory =
  | "Billing"
  | "Technical Bug"
  | "Feature Request"
  | "Account Access"
  | "Hardware/Infrastructure"
  | "Network/Connectivity"
  | "General Inquiry";

export interface Ticket {
  id: string; // The virtual ticketId from backend
  _id: string; // The Mongo ID
  customer_name: string;
  customer_email: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: string;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const STATUS_ORDER: TicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];
