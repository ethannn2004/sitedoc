import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "outline" }> = {
  online: { label: "Online", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  timeout: { label: "Timeout", variant: "warning" },
  dns_error: { label: "DNS Error", variant: "destructive" },
  ssl_error: { label: "SSL Error", variant: "destructive" },
  server_error: { label: "Server Error", variant: "destructive" },
  client_error: { label: "Client Error", variant: "warning" },
  connection_refused: { label: "Conn. Refused", variant: "destructive" },
  error: { label: "Error", variant: "destructive" },
  unknown: { label: "Unchecked", variant: "outline" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.unknown;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
