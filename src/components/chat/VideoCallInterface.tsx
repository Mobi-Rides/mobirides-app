import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface VideoCallInterfaceProps {
    status: 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';
    callerName?: string;
    callerAvatar?: string;
    isMuted: boolean;
    isCameraOff: boolean;
    onAccept: () => void;
    onDecline: () => void;
    onEnd: () => void;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    setLocalVideoElement: (element: HTMLVideoElement | null) => void;
    setRemoteVideoElement: (element: HTMLVideoElement | null) => void;
}

export function VideoCallInterface({
    status,
    callerName = 'Unknown User',
    callerAvatar,
    isMuted,
    isCameraOff,
    onAccept,
    onDecline,
    onEnd,
    onToggleMute,
    onToggleCamera,
    setLocalVideoElement,
    setRemoteVideoElement
}: VideoCallInterfaceProps) {
    const [duration, setDuration] = useState(0);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Register video elements with the hook
    useEffect(() => {
        setLocalVideoElement(localVideoRef.current);
        return () => setLocalVideoElement(null);
    }, [setLocalVideoElement]);

    useEffect(() => {
        setRemoteVideoElement(remoteVideoRef.current);
        return () => setRemoteVideoElement(null);
    }, [setRemoteVideoElement]);

    // Call duration timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'connected') {
            interval = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [status]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === 'idle') return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-in fade-in duration-300">
            {/* Remote Video (Full Screen) */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={cn(
                    "absolute inset-0 w-full h-full object-cover",
                    status !== 'connected' && "hidden"
                )}
            />

            {/* Overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            {/* Local Video (Picture-in-Picture) */}
            <div className={cn(
                "absolute top-4 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-10",
                (status !== 'connected' && status !== 'calling') && "hidden"
            )}>
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                        "w-full h-full object-cover",
                        isCameraOff && "hidden"
                    )}
                />
                {isCameraOff && (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <VideoOff className="w-8 h-8 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Calling / Incoming UI (before connected) */}
            {status !== 'connected' && (
                <div className="flex flex-col items-center z-10">
                    <Avatar className="w-28 h-28 mb-6 border-4 border-white/20 shadow-2xl">
                        <AvatarImage src={callerAvatar} />
                        <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                            {callerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <h2 className="text-3xl font-bold text-white mb-2">{callerName}</h2>

                    <p className="text-white/80 font-medium text-lg animate-pulse">
                        {status === 'calling' && 'Calling...'}
                        {status === 'incoming' && 'Incoming Video Call...'}
                        {status === 'ended' && 'Call Ended'}
                    </p>
                </div>
            )}

            {/* Connected Status Bar */}
            {status === 'connected' && (
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-3 z-10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-white font-medium">{callerName}</span>
                    <span className="text-white/70">{formatDuration(duration)}</span>
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                {status === 'incoming' ? (
                    <>
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="lg"
                                className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg transition-transform hover:scale-110"
                                onClick={onDecline}
                            >
                                <PhoneOff className="w-7 h-7" />
                            </Button>
                            <span className="text-xs text-white/80 font-medium">Decline</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="lg"
                                className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg transition-transform hover:scale-110 animate-bounce"
                                onClick={onAccept}
                            >
                                <Video className="w-7 h-7" />
                            </Button>
                            <span className="text-xs text-white/80 font-medium">Accept</span>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Mute Button */}
                        <Button
                            size="lg"
                            className={cn(
                                "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
                                isMuted
                                    ? "bg-white/20 hover:bg-white/30 text-white"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                            )}
                            onClick={onToggleMute}
                        >
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </Button>

                        {/* Camera Toggle Button */}
                        <Button
                            size="lg"
                            className={cn(
                                "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
                                isCameraOff
                                    ? "bg-white/20 hover:bg-white/30 text-white"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                            )}
                            onClick={onToggleCamera}
                        >
                            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                        </Button>

                        {/* End Call Button */}
                        <Button
                            size="lg"
                            className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg transition-transform hover:scale-110"
                            onClick={onEnd}
                        >
                            <PhoneOff className="w-7 h-7" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
