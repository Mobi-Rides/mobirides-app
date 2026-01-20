import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/utils/toast-utils';

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface UseVoiceCallProps {
    currentUserId?: string;
}

export function useVoiceCall({ currentUserId }: UseVoiceCallProps) {
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');
    const [caller, setCaller] = useState<{ id: string; name: string; avatar?: string } | null>(null);
    const [targetUserId, setTargetUserId] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const channelRef = useRef<any>(null);

    // Initialize remote audio element
    useEffect(() => {
        if (!remoteAudioRef.current) {
            remoteAudioRef.current = new Audio();
        }
    }, []);

    // Listen for incoming calls
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase.channel(`user-signaling-${currentUserId}`);

        channel
            .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
                handleSignal(payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('🔌 Connected to signaling channel');
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    const handleSignal = async (payload: any) => {
        try {
            if (payload.type === 'offer') {
                // Incoming call
                if (callStatus !== 'idle') {
                    // Busy - could send busy signal
                    return;
                }

                setCaller(payload.caller);
                setCallStatus('incoming');

                // Store offer signal to process on accept
                // We can't process it yet because we need to create the peer only after accepting
                // But for SimplePeer, we usually create peer transparently.
                // Let's store the signal data.
                (window as any).pendingOffer = payload.signal;

            } else if (payload.type === 'answer') {
                // Call accepted by remote
                if (peerRef.current) {
                    peerRef.current.signal(payload.signal);
                    setCallStatus('connected');
                }

            } else if (payload.type === 'ice-candidate') {
                if (peerRef.current) {
                    peerRef.current.signal(payload.signal);
                }

            } else if (payload.type === 'end-call') {
                endCall(false); // Don't emit end signal since they ended it
                toast.info('Call ended');
            }
        } catch (error) {
            console.error('Signal handling error:', error);
        }
    };

    const startCall = async (targetId: string, targetName: string, targetAvatar?: string) => {
        try {
            setTargetUserId(targetId);
            setCallStatus('calling');
            setCaller({ id: targetId, name: targetName, avatar: targetAvatar });

            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            // Initialize initiator peer
            const peer = new SimplePeer({
                initiator: true,
                trickle: false, // For simplicity in V1, try disable trickle ICE to send single offer. Or true for speed.
                // Let's use trickle: false for easier signaling (one large blobl) initially, 
                // to avoid race conditions with candidate signals arriving before offer.
                stream: stream
            });

            peer.on('signal', (data) => {
                // Send signal to target
                sendSignal(targetId, {
                    type: 'offer',
                    signal: data,
                    caller: {
                        id: currentUserId,
                        name: 'Incoming Call', //Ideally fetch name from profile or passing it. simpler for now.
                        // Actually we can pass known name if we have it? 
                        // The receiver should know who called based on auth, but payload helps.
                    }
                });
            });

            peer.on('stream', (remoteStream) => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                    remoteAudioRef.current.play();
                }
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                endCall();
                toast.error('Call connection failed');
            });

            peer.on('close', () => {
                endCall();
            });

            peerRef.current = peer;

        } catch (err) {
            console.error('Wait, microphone permission denied or error', err);
            toast.error('Could not access microphone');
            setCallStatus('idle');
        }
    };

    const acceptCall = async () => {
        try {
            const pendingOffer = (window as any).pendingOffer;
            if (!pendingOffer) return;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            const peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: stream
            });

            peer.on('signal', (data) => {
                if (caller) {
                    sendSignal(caller.id, {
                        type: 'answer',
                        signal: data
                    });
                }
            });

            peer.on('stream', (remoteStream) => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                    remoteAudioRef.current.play();
                }
            });

            peer.on('connect', () => {
                setCallStatus('connected');
            });

            peer.on('close', () => {
                endCall(false);
            });

            peer.signal(pendingOffer);
            peerRef.current = peer;

        } catch (err) {
            console.error('Error accepting call', err);
            toast.error('Could not answer call');
            endCall();
        }
    };

    const endCall = (notifyRemote = true) => {
        if (notifyRemote && (targetUserId || caller?.id)) {
            const target = targetUserId || caller?.id;
            if (target) {
                sendSignal(target, { type: 'end-call' });
            }
        }

        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }

        setCallStatus('ended');
        setTimeout(() => setCallStatus('idle'), 2000);
        setTargetUserId(null);
        setCaller(null);
        (window as any).pendingOffer = null;
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const sendSignal = async (targetId: string, payload: any) => {
        // Send to target user's channel
        const channel = supabase.channel(`user-signaling-${targetId}`);
        // Need to subscribe to send? Broadcast can be sent without subscribing if RLS allows?
        // Usually we subscribe to our own, and broadcast to others? 
        // Supabase Broadcast sends to all subscribers of the channel.
        // So if Target subscribes to `user-signaling-TARGET`, sending to that channel is correct.
        // But we need to use a separate channel instance or just publish?
        // Supabase-js `channel.send` needs the channel to be joined?
        // Yes. So we join the TARGET's channel temporarily to send? Or we make everyone join a common room?
        // Common room "global" is noisy.

        // Better pattern:
        // User A subscribes to `room-A`.
        // User B subscribes to `room-B`.
        // If A wants to call B, A sends a message to `room-B`.
        // To send to `room-B`, A must subscribe to `room-B` or use a server function.
        // Client-side broadcast requires being subscribed.
        // So A subscribes to `user-signaling-B`, sends message, then unsubscribes?
        // Or just keeps it open during call setup.

        const targetChannel = supabase.channel(`user-signaling-${targetId}`);
        targetChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await targetChannel.send({
                    type: 'broadcast',
                    event: 'call-signal',
                    payload: payload
                });
                // We can unsubscribe after sending if it's just a one-off signal, 
                // but for candidates/end call we might need it again. 
                // For now let's keep it simply or cleanup.
                supabase.removeChannel(targetChannel);
            }
        });

    };

    return {
        callStatus,
        caller,
        isMuted,
        startCall,
        acceptCall,
        endCall,
        toggleMute
    };
}
