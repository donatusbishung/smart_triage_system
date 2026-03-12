"use client";

import {
  Ticket,
  TicketStatus,
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_ORDER,
} from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AlertCircle, Mail, User, CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus, mongoId: string) => void;
  statusConfig: Record<
    TicketStatus,
    { color: string; icon: React.ReactNode }
  >;
  priorityColors: Record<string, string>;
}

export default function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
  onStatusChange,
  statusConfig,
  priorityColors,
}: TicketDetailDialogProps) {
  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" id="ticket-detail-dialog">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {ticket.id}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${priorityColors[ticket.priority]}`}
            >
              {ticket.priority === "critical" && (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {PRIORITY_LABELS[ticket.priority]}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold leading-tight flex items-center gap-3">
            {ticket.title}
            <Badge variant="outline" className="text-xs font-normal">
              {ticket.category}
            </Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full details for ticket {ticket.id}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">{ticket.customer_name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4 shrink-0" />
            <span className="truncate">{ticket.customer_email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span>
              {formatDate(ticket.createdAt, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Description
          </Label>
          <p className="text-sm leading-relaxed bg-muted/40 rounded-lg p-3 border">
            {ticket.description}
          </p>
        </div>

        <Separator />

        {/* Status changer */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Update Status</Label>
          <Select
            value={ticket.status}
            onValueChange={(v) =>
              onStatusChange(ticket.id, v as TicketStatus, ticket._id)
            }
          >
            <SelectTrigger
              className={`w-[160px] h-9 text-sm border ${statusConfig[ticket.status].color} cursor-pointer`}
              id="dialog-status-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s} className="text-sm">
                  <span className="flex items-center gap-1.5">
                    {statusConfig[s].icon}
                    {STATUS_LABELS[s]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  );
}
