import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/utils/toast-utils';

export type VideoCallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface UseVideoCallProps {
    currentUserId?: string;
}

interface CallerInfo {
    id: string;
    name: string;
    avatar?: string;
}

export function useVideoCall({ currentUserId }: UseVideoCallProps) {
    const [callStatus, setCallStatus] = useState<VideoCallStatus>('idle');
    const [caller, setCaller] = useState<CallerInfo | null>(null);
    const [targetUserId, setTargetUserId] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const channelRef = useRef<any>(null);

    // Set video refs for external components to bind
    const setLocalVideoElement = useCallback((element: HTMLVideoElement | null) => {
        localVideoRef.current = element;
        if (element && localStreamRef.current) {
            element.srcObject = localStreamRef.current;
        }
    }, []);

    const setRemoteVideoElement = useCallback((element: HTMLVideoElement | null) => {
        remoteVideoRef.current = element;
    }, []);

    // Listen for incoming video calls
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase.channel(`user-video-signaling-${currentUserId}`);

        channel
            .on('broadcast', { event: 'video-call-signal' }, ({ payload }) => {
                handleSignal(payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('📹 Connected to video signaling channel');
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    const handleSignal = async (payload: any) => {
        try {
            if (payload.type === 'video-offer') {
                // Incoming video call
                if (callStatus !== 'idle') {
                    // Busy - could send busy signal
                    return;
                }

                setCaller(payload.caller);
                setCallStatus('incoming');

                // Store offer signal to process on accept
                (window as any).pendingVideoOffer = payload.signal;

            } else if (payload.type === 'video-answer') {
                // Call accepted by remote
                if (peerRef.current) {
                    peerRef.current.signal(payload.signal);
                    setCallStatus('connected');
                }

            } else if (payload.type === 'video-ice-candidate') {
                if (peerRef.current) {
                    peerRef.current.signal(payload.signal);
                }

            } else if (payload.type === 'video-end-call') {
                endCall(false); // Don't emit end signal since they ended it
                toast.info('Video call ended');
            }
        } catch (error) {
            console.error('Video signal handling error:', error);
        }
    };

    const startCall = async (targetId: string, targetName: string, targetAvatar?: string) => {
        try {
            setTargetUserId(targetId);
            setCallStatus('calling');
            setCaller({ id: targetId, name: targetName, avatar: targetAvatar });

            // Get user media with both audio and video
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            localStreamRef.current = stream;

            // Set local video preview
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Initialize initiator peer
            const peer = new SimplePeer({
                initiator: true,
                trickle: false,
                stream: stream
            });

            peer.on('signal', (data) => {
                // Send signal to target
                sendSignal(targetId, {
                    type: 'video-offer',
                    signal: data,
                    caller: {
                        id: currentUserId,
                        name: 'Video Call',
                    }
                });
            });

            peer.on('stream', (remoteStream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });

            peer.on('connect', () => {
                setCallStatus('connected');
            });

            peer.on('error', (err) => {
                console.error('Video peer error:', err);
                endCall();
                toast.error('Video call connection failed');
            });

            peer.on('close', () => {
                endCall();
            });

            peerRef.current = peer;

        } catch (err: any) {
            console.error('Camera/microphone permission denied or error', err);
            if (err.name === 'NotAllowedError') {
                toast.error('Camera and microphone access required for video calls');
            } else if (err.name === 'NotFoundError') {
                toast.error('No camera or microphone found');
            } else {
                toast.error('Could not access camera or microphone');
            }
            setCallStatus('idle');
        }
    };

    const acceptCall = async () => {
        try {
            const pendingOffer = (window as any).pendingVideoOffer;
            if (!pendingOffer) return;

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            localStreamRef.current = stream;

            // Set local video preview
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: stream
            });

            peer.on('signal', (data) => {
                if (caller) {
                    sendSignal(caller.id, {
                        type: 'video-answer',
                        signal: data
                    });
                }
            });

            peer.on('stream', (remoteStream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
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

        } catch (err: any) {
            console.error('Error accepting video call', err);
            if (err.name === 'NotAllowedError') {
                toast.error('Camera and microphone access required');
            } else {
                toast.error('Could not answer video call');
            }
            endCall();
        }
    };

    const endCall = (notifyRemote = true) => {
        if (notifyRemote && (targetUserId || caller?.id)) {
            const target = targetUserId || caller?.id;
            if (target) {
                sendSignal(target, { type: 'video-end-call' });
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

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        setCallStatus('ended');
        setTimeout(() => setCallStatus('idle'), 2000);
        setTargetUserId(null);
        setCaller(null);
        setIsMuted(false);
        setIsCameraOff(false);
        (window as any).pendingVideoOffer = null;
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

    const toggleCamera = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    const sendSignal = async (targetId: string, payload: any) => {
        const targetChannel = supabase.channel(`user-video-signaling-${targetId}`);
        targetChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await targetChannel.send({
                    type: 'broadcast',
                    event: 'video-call-signal',
                    payload: payload
                });
                supabase.removeChannel(targetChannel);
            }
        });
    };

    return {
        callStatus,
        caller,
        isMuted,
        isCameraOff,
        startCall,
        acceptCall,
        endCall,
        toggleMute,
        toggleCamera,
        setLocalVideoElement,
        setRemoteVideoElement
    };
}
