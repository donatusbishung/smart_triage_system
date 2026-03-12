"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  TicketStatus,
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_ORDER,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
} from "lucide-react";
import TicketDetailDialog from "@/components/TicketDetailDialog";

const statusConfig: Record<
  TicketStatus,
  { color: string; icon: React.ReactNode }
> = {
  open: {
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30",
    icon: <Inbox className="w-3 h-3" />,
  },
  in_progress: {
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
    icon: <Clock className="w-3 h-3" />,
  },
  resolved: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-200 dark:border-green-500/30",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  closed: {
    color:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300 border-slate-200 dark:border-slate-500/30",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  medium:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  critical:
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

export default function DashboardPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const session = document.cookie
        .split("; ")
        .find((row) => row.startsWith("triage_session="))
        ?.split("=")[1];

      if (!session) {
        router.push("/login");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/tickets`, {
        headers: {
          Authorization: `Bearer ${session}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
        }
        throw new Error("Failed to fetch tickets");
      }

      const data = await res.json();
      
      // Map backend fields to frontend types (e.g. backend returns _id, ticketId, title, customer_name, customer_email)
      const mappedTickets = data.tickets.map((t: any) => ({
        ...t,
        id: t.ticketId || t._id, // Use virtual short ID if available
        name: t.customer_name,
        email: t.customer_email,
        subject: t.title,
      }));
      
      setTickets(mappedTickets);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = useCallback(
    async (ticketId: string, newStatus: TicketStatus, mongoId: string) => {
      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: newStatus } : t
        )
      );
      
      try {
        const session = document.cookie
          .split("; ")
          .find((row) => row.startsWith("triage_session="))
          ?.split("=")[1];

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${API_URL}/api/tickets/${mongoId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });
        
        if (!res.ok) throw new Error("Failed to update status");
        
        toast.success(`Ticket ${ticketId} updated`, {
          description: `Status changed to ${STATUS_LABELS[newStatus]}`,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to update ticket status");
        // Revert on failure
        fetchTickets(); 
      }
    },
    []
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const stats = STATUS_ORDER.map((s) => ({
    status: s,
    count: tickets.filter((t) => t.status === s).length,
    ...statusConfig[s],
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Ticket <span className="text-black">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tickets.length} total tickets
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card
            key={s.status}
            className="border shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_LABELS[s.status]}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tickets Table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">All Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden md:table-cell">
                  Category
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Submitted By
                </TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                  id={`ticket-row-${ticket.id}`}
                >
                  <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                    {ticket.id}
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {ticket.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-xs bg-muted font-normal">
                      {ticket.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {ticket.customer_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityColors[ticket.priority]}`}
                    >
                      {ticket.priority === "critical" && (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {PRIORITY_LABELS[ticket.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={ticket.status}
                        onValueChange={(v) =>
                          handleStatusChange(ticket.id, v as TicketStatus, ticket._id)
                        }
                      >
                        <SelectTrigger
                          className={`h-7 w-[130px] text-xs border ${statusConfig[ticket.status].color} cursor-pointer`}
                          id={`status-select-${ticket.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              <span className="flex items-center gap-1.5">
                                {statusConfig[s].icon}
                                {STATUS_LABELS[s]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <TicketDetailDialog
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        onStatusChange={handleStatusChange}
        statusConfig={statusConfig}
        priorityColors={priorityColors}
      />
    </div>
  );
}
