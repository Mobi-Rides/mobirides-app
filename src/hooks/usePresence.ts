import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PresenceState {
    [key: string]: any;
}

export const usePresence = (conversationId: string | undefined, userId: string | undefined) => {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!conversationId || !userId) return;

        const channel = supabase.channel(`presence-${conversationId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState<PresenceState>();
                const users = new Set<string>();

                Object.keys(newState).forEach(key => {
                    users.add(key);
                });

                console.log('👥 [PRESENCE] Sync:', Array.from(users));
                setOnlineUsers(users);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('👋 [PRESENCE] User joined:', key, newPresences);
                setOnlineUsers(prev => {
                    const next = new Set(prev);
                    next.add(key);
                    return next;
                });
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('👋 [PRESENCE] User left:', key, leftPresences);
                setOnlineUsers(prev => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [conversationId, userId]);

    return { onlineUsers };
};
