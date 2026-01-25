import { useState, useRef, KeyboardEvent, useEffect, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  X,
  Mic,
  Square,
  FileIcon,
  Loader2
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface MessageInputProps {
  placeholder?: string;
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video' | 'audio' | 'file', metadata?: any, replyToMessageId?: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  replyToMessage?: {
    id: string;
    content: string;
    senderName: string;
  };
  onCancelReply?: () => void;
  currentUserId?: string;
}

interface PreviewFile {
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
}

export function MessageInput({
  placeholder = "Type a message...",
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
  isLoading = false,
  replyToMessage,
  onCancelReply,
  currentUserId,
  initialValue = ''
}: MessageInputProps & { initialValue?: string }) {
  const [message, setMessage] = useState(initialValue);
  
  // Update message if initialValue changes
  useEffect(() => {
    if (initialValue) {
      setMessage(initialValue);
    }
  }, [initialValue]);

  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // Cleanup preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (previewFile?.url && (previewFile.type === 'image' || previewFile.type === 'audio')) {
        URL.revokeObjectURL(previewFile.url);
      }
    };
  }, [previewFile]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Audio recording is not supported in this environment. Please ensure you are using a secure connection (HTTPS) or localhost.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        setPreviewFile({
          file: audioFile,
          url: audioUrl,
          type: 'audio'
        });

        // Clear recording state
        setIsRecording(false);
        setRecordingDuration(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please enable it in your browser settings.');
      } else {
        toast.error('Failed to start recording. Please try again.');
      }
    }
  }, []);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Stop without triggering onstop handler to save
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        // Stop all tracks
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    audioChunksRef.current = [];
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, inputType: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (e.g., 50MB for images, 100MB for videos)
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 50 * 1024 * 1024;

      if (file.size > maxSize) {
        toast.error(`File size must be less than ${isVideo ? '100MB' : '50MB'}`);
        return;
      }

      // Detect actual type based on MIME
      let actualType: 'image' | 'video' | 'file' = inputType;
      if (file.type.startsWith('video/')) {
        actualType = 'video';
      } else if (file.type.startsWith('image/')) {
        actualType = 'image';
      }

      const previewUrl = (actualType === 'image' || actualType === 'video') ? URL.createObjectURL(file) : '';
      setPreviewFile({
        file,
        url: previewUrl,
        type: actualType
      });

      textareaRef.current?.focus();
    }
  };

  const clearPreview = () => {
    if (previewFile?.url && (previewFile.type === 'image' || previewFile.type === 'video' || previewFile.type === 'audio')) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const uploadFile = async (file: File): Promise<{ url: string, path: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${currentUserId ? `${currentUserId}/` : ''}${fileName}`;

      console.log('🔍 Upload Debug:', { currentUserId, fileName, filePath, fileSize: file.size });

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return { url: publicUrl, path: filePath };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !previewFile) || disabled || isLoading || isUploading) return;

    try {
      if (previewFile) {
        setIsUploading(true);
        const uploadResult = await uploadFile(previewFile.file);

        if (uploadResult) {
          onSendMessage(
            message.trim() || (
              previewFile.type === 'image' ? 'Sent an image' :
                previewFile.type === 'video' ? 'Sent a video' :
                  previewFile.type === 'audio' ? 'Sent a voice message' :
                    `Sent a file: ${previewFile.file.name}`
            ),
            previewFile.type,
            {
              url: uploadResult.url,
              path: uploadResult.path,
              fileName: previewFile.file.name,
              fileSize: previewFile.file.size,
              mimeType: previewFile.file.type,
              duration: previewFile.type === 'audio' ? recordingDuration : undefined
            },
            replyToMessage?.id
          );
        }
      } else {
        onSendMessage(message.trim(), 'text', {}, replyToMessage?.id);
      }

      setMessage('');
      clearPreview();
      handleStopTyping();
      onCancelReply?.();

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Send failed:', error);
      toast.error('Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Handle typing indicators (only for text)
    if (value.trim() && !isTyping) {
      handleStartTyping();
    } else if (!value.trim() && isTyping) {
      handleStopTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    }
  };

  const handleStartTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      onStartTyping?.();
    }
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      onStopTyping?.();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <div className="border-t border-notification-border bg-card">
      {/* File Preview Area */}
      {previewFile && (
        <div className="px-4 pt-4 pb-2">
          <div className="relative inline-block">
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
              {previewFile.type === 'image' ? (
                <img
                  src={previewFile.url}
                  alt="Preview"
                  className="h-20 w-auto object-cover max-w-[200px]"
                />
              ) : previewFile.type === 'video' ? (
                <video
                  src={previewFile.url}
                  className="h-20 w-auto max-w-[200px] rounded"
                  muted
                />
              ) : previewFile.type === 'audio' ? (
                <div className="flex items-center gap-3 p-3 min-w-[200px]">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Mic className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">Voice Message</p>
                    <audio src={previewFile.url} controls className="h-8 w-full max-w-[180px]" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 min-w-[150px]">
                  <div className="p-2 bg-background rounded-md">
                    <FileIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate max-w-[120px]">
                      {previewFile.file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {(previewFile.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={clearPreview}
              className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Reply indicator */}
      {replyToMessage && (
        <div className="flex items-center justify-between p-3 border-b border-notification-border bg-primary/5 rounded-t-lg shadow-sm transition-all duration-200">
          <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
            <p className="text-xs text-muted-foreground">
              Replying to <span className="font-medium text-primary">{replyToMessage.senderName}</span>
            </p>
            <p className="text-sm text-foreground truncate">
              {replyToMessage.content}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelReply}
            className="h-6 w-6 p-0 ml-2 rounded-full hover:bg-primary/10 transition-colors duration-200"
          >
            <X className="w-4 h-4 text-primary" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* File Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'file')}
          />
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            type="file"
            ref={audioInputRef}
            className="hidden"
            accept="audio/*"
            onChange={(e) => handleFileSelect(e, 'audio')}
          />

          {/* Attachment button - hidden during recording */}
          {!isRecording && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 flex-shrink-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4 text-primary" />
            </Button>
          )}

          {/* Message input or Recording indicator */}
          <div className="flex-1 relative">
            {isRecording ? (
              // Recording UI
              <div className="flex items-center justify-between h-9 px-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Recording {formatDuration(recordingDuration)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                  onClick={cancelRecording}
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={previewFile ? "Add a caption..." : (isLoading || isUploading ? "Sending..." : placeholder)}
                  disabled={disabled || isLoading || isUploading}
                  className={cn(
                    "min-h-9 max-h-32 resize-none bg-notification border-notification-border rounded-2xl",
                    "focus:ring-1 focus:ring-primary focus:border-primary shadow-sm",
                    "pr-20 transition-all duration-200",
                    (isLoading || isUploading) && "opacity-60 cursor-not-allowed"
                  )}
                  rows={1}
                />

                {/* Input actions */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
                    disabled={disabled || isUploading}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon className="w-4 h-4 text-primary" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
                        disabled={disabled || isUploading}
                      >
                        <Smile className="w-4 h-4 text-primary" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top" align="end" sideOffset={10}>
                      <div className="shadow-xl rounded-lg overflow-hidden border border-border">
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          theme={Theme.AUTO}
                          lazyLoadEmojis={true}
                          searchDisabled={false}
                          width={300}
                          height={400}
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>

          {/* Send/Voice/Stop button */}
          {isRecording ? (
            // Stop recording button
            <Button
              size="sm"
              onClick={stopRecording}
              className="h-9 w-9 p-0 flex-shrink-0 bg-red-500 hover:bg-red-600 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <Square className="w-4 h-4 fill-white" />
            </Button>
          ) : message.trim() || previewFile ? (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={disabled || isLoading || isUploading}
              className="h-9 w-9 p-0 flex-shrink-0 bg-primary hover:bg-primary/90 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 flex-shrink-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
              disabled={disabled || isUploading}
              onClick={startRecording}
            >
              <Mic className="w-4 h-4 text-primary" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}