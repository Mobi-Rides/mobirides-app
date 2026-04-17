import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resendEmailService } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Send, Clock, X, Eye, Edit3, Megaphone, Users, Mail, Bell } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Audience = 'all' | 'renters' | 'hosts' | 'verified' | 'active_30d';
type Channel = 'email' | 'push' | 'both';
type BroadcastStatus = 'pending' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'cancelled';

interface BroadcastRecord {
  id: string;
  created_at: string;
  sent_at: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  status: BroadcastStatus;
  audience: Audience;
  channel: Channel;
  subject: string;
  recipient_count: number;
  delivery_count: number;
  failure_count: number;
}

// ─── Audience Options ─────────────────────────────────────────────────────────
const AUDIENCE_OPTIONS: { value: Audience; label: string; icon: string }[] = [
  { value: 'all', label: 'All Users', icon: '👥' },
  { value: 'renters', label: 'All Renters', icon: '🚗' },
  { value: 'hosts', label: 'All Hosts', icon: '🏠' },
  { value: 'verified', label: 'Verified Users', icon: '✅' },
  { value: 'active_30d', label: 'Active (Last 30 Days)', icon: '📅' },
];

const CHANNEL_OPTIONS: { value: Channel; label: string; icon: React.ReactNode }[] = [
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'push', label: 'Push', icon: <Bell className="w-4 h-4" /> },
  { value: 'both', label: 'Email + Push', icon: <Megaphone className="w-4 h-4" /> },
];

const STATUS_COLORS: Record<BroadcastStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

// ─── Simple Markdown Renderer ─────────────────────────────────────────────────
function MarkdownPreview({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mb-2">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mb-1">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br/>');
  return (
    <div
      className="prose prose-sm max-w-none p-4 bg-muted rounded-md min-h-[120px] text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BroadcastNotificationSection() {
  // Form state
  const [audience, setAudience] = useState<Audience>('all');
  const [channel, setChannel] = useState<Channel>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [showCta, setShowCta] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // UI state
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // History
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Fetch recipient count estimate ──────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    setLoadingCount(true);
    try {
      let query = supabase.from('profiles').select('id', { count: 'exact', head: true });
      if (audience === 'renters') query = query.eq('role', 'renter');
      else if (audience === 'hosts') query = query.eq('role', 'host');
      else if (audience === 'verified') query = query.eq('is_verified', true);
      else if (audience === 'active_30d') {
        const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('last_active_at', d);
      }
      const { count } = await query;
      setRecipientCount(count ?? 0);
    } catch {
      setRecipientCount(null);
    } finally {
      setLoadingCount(false);
    }
  }, [audience]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  // ── Fetch broadcast history ─────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('system_broadcasts')
      .select('id,created_at,sent_at,scheduled_at,completed_at,status,audience,channel,subject,recipient_count,delivery_count,failure_count')
      .order('created_at', { ascending: false })
      .limit(20);
    setBroadcasts((data as BroadcastRecord[]) ?? []);
    setLoadingHistory(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Send ────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    try {
      const result = await resendEmailService.sendSystemBroadcast({
        audience,
        channel,
        subject,
        message,
        cta_text: showCta ? ctaText : undefined,
        cta_url: showCta ? ctaUrl : undefined,
        scheduled_at: scheduleMode && scheduledAt ? scheduledAt : undefined,
      });

      if (result.rateLimited) {
        toast({ title: 'Rate limit reached', description: result.error, variant: 'destructive' });
      } else if (result.success) {
        const isScheduled = scheduleMode && scheduledAt;
        toast({
          title: isScheduled ? '📅 Broadcast Scheduled' : '📢 Broadcast Sent',
          description: isScheduled
            ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}`
            : `Sent to ${result.deliveryCount ?? 0} of ${result.recipientCount ?? 0} recipients`,
        });
        // Reset form
        setSubject(''); setMessage(''); setCtaText(''); setCtaUrl('');
        setScheduledAt(''); setScheduleMode(false); setShowCta(false);
        fetchHistory();
      } else {
        toast({ title: 'Send failed', description: result.error, variant: 'destructive' });
      }
    } finally {
      setSending(false);
    }
  };

  // ── Cancel broadcast ────────────────────────────────────────────────────────
  const handleCancel = async (broadcastId: string) => {
    const result = await resendEmailService.cancelBroadcast(broadcastId);
    if (result.success) {
      toast({ title: 'Broadcast cancelled' });
      fetchHistory();
    } else {
      toast({ title: 'Cancel failed', description: result.error, variant: 'destructive' });
    }
  };

  const isValid = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* ── Compose ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Compose Broadcast</h2>
        </div>

        {/* Audience */}
        <div className="space-y-2">
          <Label>Audience</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AUDIENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAudience(opt.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  audience === opt.value
                    ? 'border-primary bg-primary/10 font-medium'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {loadingCount ? 'Estimating...' : `~${recipientCount?.toLocaleString() ?? '?'} recipients`}
          </p>
        </div>

        {/* Channel */}
        <div className="space-y-2">
          <Label>Channel</Label>
          <div className="flex gap-2">
            {CHANNEL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setChannel(opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                  channel === opt.value
                    ? 'border-primary bg-primary/10 font-medium'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="broadcast-subject">Subject</Label>
          <Input
            id="broadcast-subject"
            placeholder="e.g. Important service update from MobiRides"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        {/* Message with preview toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="broadcast-message">Message (Markdown supported)</Label>
            <button
              onClick={() => setPreviewMode(p => !p)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {previewMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>
          </div>
          {previewMode ? (
            <MarkdownPreview text={message} />
          ) : (
            <Textarea
              id="broadcast-message"
              placeholder="Write your message here... Supports **bold**, *italic*, # headings, and - lists"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="min-h-[120px] resize-y"
            />
          )}
        </div>

        {/* Optional CTA */}
        <div className="space-y-3">
          <button
            onClick={() => setShowCta(p => !p)}
            className="text-sm text-primary underline underline-offset-4"
          >
            {showCta ? '− Remove CTA button' : '+ Add call-to-action button (optional)'}
          </button>
          {showCta && (
            <div className="grid grid-cols-2 gap-3 pl-1">
              <div className="space-y-1">
                <Label>Button Label</Label>
                <Input placeholder="e.g. Learn More" value={ctaText} onChange={e => setCtaText(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Button URL</Label>
                <Input placeholder="https://mobirides.com/..." value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Schedule toggle */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScheduleMode(false)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${!scheduleMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}
            >
              Send Now
            </button>
            <button
              onClick={() => setScheduleMode(true)}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm border transition-all ${scheduleMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}
            >
              <Clock className="w-3 h-3" /> Schedule
            </button>
          </div>
          {scheduleMode && (
            <div className="space-y-1">
              <Label>Send At</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        {/* Action button */}
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!isValid || sending || (scheduleMode && !scheduledAt)}
          className="gap-2"
        >
          {scheduleMode ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending…' : scheduleMode ? 'Schedule Broadcast' : 'Send Broadcast'}
        </Button>
      </div>

      {/* ── Confirmation Modal ───────────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Broadcast</DialogTitle>
            <DialogDescription>
              You are about to send a notification to approximately{' '}
              <strong>{recipientCount?.toLocaleString() ?? '?'} users</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Audience</span><span className="font-medium">{AUDIENCE_OPTIONS.find(o => o.value === audience)?.label}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span className="font-medium capitalize">{channel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="font-medium truncate max-w-[240px]">{subject}</span></div>
            {scheduleMode && scheduledAt && (
              <div className="flex justify-between"><span className="text-muted-foreground">Send At</span><span className="font-medium">{new Date(scheduledAt).toLocaleString()}</span></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} className="gap-2">
              {scheduleMode ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {scheduleMode ? 'Confirm Schedule' : 'Confirm Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Broadcast History ────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Broadcast History</h2>
        {loadingHistory ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No broadcasts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {broadcasts.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium max-w-[160px] truncate">{b.subject}</TableCell>
                    <TableCell className="capitalize">{b.audience.replace('_', ' ')}</TableCell>
                    <TableCell className="capitalize">{b.channel}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell>{b.recipient_count}</TableCell>
                    <TableCell className="text-green-600">{b.delivery_count}</TableCell>
                    <TableCell className="text-red-500">{b.failure_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {b.sent_at ? new Date(b.sent_at).toLocaleString() : b.scheduled_at ? `Scheduled: ${new Date(b.scheduled_at).toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell>
                      {(b.status === 'pending' || b.status === 'scheduled') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 px-2"
                          onClick={() => handleCancel(b.id)}
                        >
                          <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
