"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiGet, apiPatch } from "@/lib/fetchService";
import { formatDate } from "@/lib/utils";
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = document.cookie
        .split("; ")
        .find((row) => row.startsWith("triage_session="))
        ?.split("=")[1];

      if (!session) {
        router.push("/login");
        return;
      }

      const data = await apiGet<{ tickets: any[], totalPages: number, total: number }>(`/api/tickets?page=${page}&limit=10`);
      
      const mappedTickets = data.tickets.map((t: any) => ({
        ...t,
        id: t.ticketId || t._id,
        name: t.customer_name,
        email: t.customer_email,
        subject: t.title,
      }));
      
      setTickets(mappedTickets);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      console.error(err);
      if (err.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load tickets");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, router]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = useCallback(
    async (ticketId: string, newStatus: TicketStatus, mongoId: string) => {
      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: newStatus } : t
        )
      );
      
      try {
        await apiPatch(`/api/tickets/${mongoId}`, { status: newStatus });
        
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

  // Stats (Using totalCount for total dashboard tickets indicator)
  const stats = STATUS_ORDER.map((s) => ({
    status: s,
    count: tickets.filter((t) => t.status === s).length,
    ...statusConfig[s],
  }));

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Ticket <span className="text-black">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalCount} total tickets
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

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={page <= 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page >= totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
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
