import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getContactMessages, type ContactMessage } from "@/lib/contact-service";

export function ContactTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    getContactMessages()
      .then(setMessages)
      .catch((err: Error) => toast.error(err.message ?? "Failed to load messages"))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...messages].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "created_at":
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "subject":
        cmp = a.subject.localeCompare(b.subject);
        break;
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "email":
        cmp = a.email.localeCompare(b.email);
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contact messages
        </CardTitle>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date</SelectItem>
              <SelectItem value="subject">Subject</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setSortAsc(!sortAsc)}
            title={sortAsc ? "Ascending" : "Descending"}
          >
            {sortAsc ? "↑" : "↓"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No messages yet.</p>
        ) : (
          <div className="divide-y">
            {sorted.map((m) => (
              <div key={m.id}>
                <button
                  onClick={() => toggle(m.id)}
                  className="flex w-full items-center justify-between gap-4 p-3 text-left hover:bg-muted/50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{m.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.name} &lt;{m.email}&gt;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                    {expanded.has(m.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {expanded.has(m.id) && (
                  <div className="border-t bg-muted/20 px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm">{m.message}</p>
                    <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{m.name}</Badge>
                      <Badge variant="outline">{m.email}</Badge>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
