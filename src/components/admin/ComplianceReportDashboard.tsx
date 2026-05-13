import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Download, RefreshCw, FileLock, ShieldCheck, ChevronDown } from "lucide-react";
import { format } from "date-fns";

interface ComplianceReport {
  id: string;
  report_month: string;
  storage_path: string | null;
  public_key_fingerprint: string;
  signature_b64: string | null;
  generated_by: string | null;
  generated_at: string;
  record_count: number;
  status: "completed" | "failed";
  error_details: string | null;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

function ReportsTab() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: reports, isLoading } = useQuery<ComplianceReport[]>({
    queryKey: ["compliance-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_reports")
        .select("*")
        .order("report_month", { ascending: false });
      if (error) throw error;
      return data as ComplianceReport[];
    },
  });

  const handleDownload = async (storagePath: string, month: string) => {
    const { data, error } = await supabase.storage
      .from("compliance-reports")
      .createSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) {
      toast.error("Failed to generate download link");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = `compliance-${month}.pdf`;
    a.click();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compliance-report`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ month: selectedMonth }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Generation failed");
      toast.success(`Report for ${selectedMonth} generated (${result.record_count} records)`);
      queryClient.invalidateQueries({ queryKey: ["compliance-reports"] });
      setGenerateOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {reports?.length ?? 0} report(s) on record
        </p>
        <Button onClick={() => setGenerateOpen(true)} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Compliance Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Report Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!reports?.length ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
          <FileLock className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No reports yet</p>
          <p className="text-sm">Generate your first compliance report above.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead>Generated By</TableHead>
                <TableHead>Generated At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <React.Fragment key={r.id}>
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{r.report_month}</TableCell>
                    <TableCell className="text-right font-mono">{r.record_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.generated_by ? r.generated_by.slice(0, 8) + "…" : "cron"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(r.generated_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[r.status]}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "completed" && r.storage_path && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(r.storage_path!, r.report_month)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {r.status === "failed" && r.error_details && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-0">
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-red-600 py-1">
                            <ChevronDown className="h-3 w-3" /> Show error
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="text-xs bg-red-50 text-red-800 p-2 rounded mb-2 whitespace-pre-wrap">
                              {r.error_details}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function VerifyTab() {
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; key_fingerprint: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const publicKeyPem = atob(import.meta.env.VITE_COMPLIANCE_PUBLIC_KEY ?? "");
  const keyFingerprint = import.meta.env.VITE_COMPLIANCE_KEY_FINGERPRINT ?? "";

  const handleCopy = () => {
    navigator.clipboard.writeText(publicKeyPem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!sigFile || !jsonFile) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const [sigB64, canonicalJson] = await Promise.all([
        sigFile.arrayBuffer().then((buf) => {
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (const b of bytes) binary += String.fromCharCode(b);
          return btoa(binary);
        }),
        jsonFile.text(),
      ]);

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compliance-report`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "verify", canonical_json: canonicalJson, signature_b64: sigB64 }),
        }
      );
      const result = await res.json();
      setVerifyResult(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            System Public Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Fingerprint (SHA-256):</span>
            <code className="bg-muted px-2 py-0.5 rounded text-xs break-all">{keyFingerprint}</code>
          </div>
          <div className="relative">
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap break-all">
              {publicKeyPem || "VITE_COMPLIANCE_PUBLIC_KEY not set"}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 text-xs"
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">OpenSSL Verification Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Download a report's <code>.sig</code> file and its canonical JSON payload, then run:
          </p>
          <pre className="bg-muted p-3 rounded text-xs whitespace-pre-wrap">{`# Save the public key above to public_key.pem, then:
openssl dgst -sha256 \\
  -verify public_key.pem \\
  -signature compliance-YYYY-MM.sig \\
  report_payload.json

# Expected output on success:
# Verified OK`}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a <code>.sig</code> file and the canonical JSON payload to verify server-side.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Signature file (.sig)</label>
              <input
                type="file"
                accept=".sig"
                onChange={(e) => setSigFile(e.target.files?.[0] ?? null)}
                className="text-sm w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Canonical JSON payload (.json)</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setJsonFile(e.target.files?.[0] ?? null)}
                className="text-sm w-full"
              />
            </div>
          </div>
          <Button onClick={handleVerify} disabled={!sigFile || !jsonFile || verifying}>
            {verifying ? "Verifying…" : "Verify Signature"}
          </Button>
          {verifyResult && (
            <div className={`p-3 rounded text-sm font-medium ${verifyResult.valid ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {verifyResult.valid
                ? "✓ Signature VALID — document is authentic"
                : "✗ Signature INVALID — document may be tampered"}
              <div className="text-xs font-normal mt-1">Key fingerprint: {verifyResult.key_fingerprint}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ComplianceReportDashboard() {
  return (
    <Tabs defaultValue="reports" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="verify">Verify Signature</TabsTrigger>
      </TabsList>
      <TabsContent value="reports">
        <ReportsTab />
      </TabsContent>
      <TabsContent value="verify">
        <VerifyTab />
      </TabsContent>
    </Tabs>
  );
}
