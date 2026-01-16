import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CallInterfaceProps {
    status: 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';
    callerName?: string;
    callerAvatar?: string;
    isMuted: boolean;
    onAccept: () => void;
    onDecline: () => void;
    onEnd: () => void;
    onToggleMute: () => void;
}

export function CallInterface({
    status,
    callerName = 'Unknown User',
    callerAvatar,
    isMuted,
    onAccept,
    onDecline,
    onEnd,
    onToggleMute
}: CallInterfaceProps) {
    const [duration, setDuration] = useState(0);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-border">
                {/* Header / Info */}
                <div className="flex flex-col items-center p-8 pb-12 bg-gradient-to-b from-primary/10 to-transparent">
                    <Avatar className="w-24 h-24 mb-4 border-4 border-background shadow-lg">
                        <AvatarImage src={callerAvatar} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            {callerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <h2 className="text-2xl font-bold text-foreground mb-1">{callerName}</h2>

                    <p className="text-muted-foreground font-medium animate-pulse">
                        {status === 'calling' && 'Calling...'}
                        {status === 'incoming' && 'Incoming Audio Call...'}
                        {status === 'connected' && formatDuration(duration)}
                        {status === 'ended' && 'Call Ended'}
                    </p>
                </div>

                {/* Controls */}
                <div className="p-8 flex justify-center items-center gap-8">
                    {status === 'incoming' ? (
                        <>
                            <div className="flex flex-col items-center gap-2">
                                <Button
                                    size="lg"
                                    className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg transition-transform hover:scale-110"
                                    onClick={onDecline}
                                >
                                    <PhoneOff className="w-8 h-8" />
                                </Button>
                                <span className="text-xs text-muted-foreground font-medium">Decline</span>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <Button
                                    size="lg"
                                    className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg transition-transform hover:scale-110 animate-bounce"
                                    onClick={onAccept}
                                >
                                    <Phone className="w-8 h-8" />
                                </Button>
                                <span className="text-xs text-muted-foreground font-medium">Accept</span>
                            </div>
                        </>
                    ) : (
                        <>
                            {status === 'connected' && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className={cn(
                                        "h-14 w-14 rounded-full border-2 transition-all duration-200",
                                        isMuted ? "bg-muted text-muted-foreground border-transparent" : "bg-card hover:bg-muted"
                                    )}
                                    onClick={onToggleMute}
                                >
                                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                </Button>
                            )}

                            <Button
                                size="lg"
                                className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg transition-transform hover:scale-110"
                                onClick={onEnd}
                            >
                                <PhoneOff className="w-8 h-8" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
