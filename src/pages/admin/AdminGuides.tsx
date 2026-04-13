/**
 * Admin FAQ / Guide Management page.
 * Full CRUD for the `guides` table.
 * 
 * @author Modisa Maphanyane
 * @ticket MOB-314
 */

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface GuideRow {
  id: string;
  title: string;
  description: string | null;
  section: string;
  role: string;
  read_time: string | null;
  is_popular: boolean | null;
  sort_order: number | null;
  content: Json;
  created_at: string | null;
  updated_at: string | null;
}

interface StepInput {
  title: string;
  content: string;
  action?: string;
}

const emptyForm = {
  title: "",
  description: "",
  section: "",
  role: "shared" as string,
  read_time: "5 min",
  is_popular: false,
  sort_order: 0,
  steps: [] as StepInput[],
};

const AdminGuides = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Queries ──
  const { data: guides, isLoading } = useQuery({
    queryKey: ["admin-guides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .order("role")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuideRow[];
    },
  });

  // ── Mutations ──
  const upsertMutation = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      const record = {
        title: payload.title,
        description: payload.description || null,
        section: payload.section,
        role: payload.role,
        read_time: payload.read_time || "5 min",
        is_popular: payload.is_popular,
        sort_order: payload.sort_order,
        content: { steps: payload.steps } as unknown as Json,
      };

      if (payload.id) {
        const { error } = await supabase
          .from("guides")
          .update(record)
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guides").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      toast.success(editingId ? "Guide updated" : "Guide created");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      toast.success("Guide deleted");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Helpers ──
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (guide: GuideRow) => {
    setEditingId(guide.id);
    const content = guide.content as any;
    setForm({
      title: guide.title,
      description: guide.description || "",
      section: guide.section,
      role: guide.role,
      read_time: guide.read_time || "5 min",
      is_popular: guide.is_popular || false,
      sort_order: guide.sort_order || 0,
      steps: (content?.steps || []).map((s: any) => ({
        title: s.title || "",
        content: s.content || "",
        action: typeof s.action === "object" ? s.action?.label : s.action || "",
      })),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const addStep = () =>
    setForm((f) => ({ ...f, steps: [...f.steps, { title: "", content: "", action: "" }] }));

  const removeStep = (idx: number) =>
    setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }));

  const updateStep = (idx: number, field: keyof StepInput, value: string) =>
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));

  const handleSave = () => {
    if (!form.title || !form.section) {
      toast.error("Title and section slug are required");
      return;
    }
    const cleanSteps = form.steps.map((s) => ({
      title: s.title,
      content: s.content,
      ...(s.action ? { action: { label: s.action } } : {}),
    }));
    upsertMutation.mutate({ ...form, steps: cleanSteps as any, id: editingId || undefined });
  };

  const filtered = (guides || []).filter(
    (g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.section.toLowerCase().includes(search.toLowerCase()) ||
      g.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadgeVariant = (role: string) => {
    if (role === "host") return "default";
    if (role === "renter") return "secondary";
    return "outline";
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">FAQ & Guide Management</h1>
              <p className="text-muted-foreground">
                Create and manage help center guides for renters, hosts, and shared content.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> New Guide
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guides..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Popular</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No guides found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((guide) => {
                      const steps = (guide.content as any)?.steps || [];
                      return (
                        <TableRow key={guide.id}>
                          <TableCell className="font-medium">{guide.title}</TableCell>
                          <TableCell className="font-mono text-xs">{guide.section}</TableCell>
                          <TableCell>
                            <Badge variant={roleBadgeVariant(guide.role)}>{guide.role}</Badge>
                          </TableCell>
                          <TableCell>{steps.length}</TableCell>
                          <TableCell>{guide.is_popular ? "★" : "—"}</TableCell>
                          <TableCell>{guide.sort_order}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(guide)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleteId(guide.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Guide" : "Create Guide"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Section slug *</Label>
                  <Input
                    value={form.section}
                    onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                    placeholder="e.g. getting-started"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="renter">Renter</SelectItem>
                      <SelectItem value="host">Host</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Read time</Label>
                  <Input value={form.read_time} onChange={(e) => setForm((f) => ({ ...f, read_time: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_popular}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_popular: v }))}
                />
                <Label>Mark as popular</Label>
              </div>

              {/* Steps editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Steps ({form.steps.length})</Label>
                  <Button size="sm" variant="outline" onClick={addStep}>
                    <Plus className="h-3 w-3 mr-1" /> Add Step
                  </Button>
                </div>

                {form.steps.map((step, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Step {idx + 1}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-destructive" onClick={() => removeStep(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Step title"
                      value={step.title}
                      onChange={(e) => updateStep(idx, "title", e.target.value)}
                    />
                    <Textarea
                      placeholder="Step content"
                      value={step.content}
                      onChange={(e) => updateStep(idx, "content", e.target.value)}
                      rows={2}
                    />
                    <Input
                      placeholder="Action label (optional, e.g. Browse Cars)"
                      value={step.action || ""}
                      onChange={(e) => updateStep(idx, "action", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Guide</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              This will permanently delete this guide and any associated user progress data. Are you sure?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminGuides;
