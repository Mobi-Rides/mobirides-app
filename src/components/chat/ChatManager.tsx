import { useState, useEffect } from 'react';
import { ChatPopup } from './ChatPopup';
import { FloatingChatButton } from './FloatingChatButton';
import { useMessages } from '@/hooks/useMessages';
import { useNavigate } from 'react-router-dom';

interface ChatManagerProps {
  recipientId?: string;
  recipientName?: string;
}

export function ChatManager({ recipientId, recipientName }: ChatManagerProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewMode, setViewMode] = useState<'popup' | 'fullscreen'>('popup');
  const { messages } = useMessages();
  const navigate = useNavigate();

  // Calculate unread messages count
  const unreadCount = messages?.filter(msg => msg.status === 'sent').length || 0;

  // Auto-open popup if recipient is provided
  useEffect(() => {
    if (recipientId && recipientName) {
      setIsPopupOpen(true);
      setViewMode('popup');
    }
  }, [recipientId, recipientName]);

  const handleOpenChat = () => {
    setIsPopupOpen(true);
    setIsMinimized(false);
  };

  const handleCloseChat = () => {
    setIsPopupOpen(false);
    setIsMinimized(false);
  };

  const handleMinimizeChat = () => {
    setIsMinimized(true);
  };

  const handleMaximizeChat = () => {
    setIsPopupOpen(false);
    navigate('/messages', { 
      state: { recipientId, recipientName } 
    });
  };

  // Don't show floating button if we're already on the messages page
  const isOnMessagesPage = window.location.pathname === '/messages';

  return (
    <>
      {/* Floating Chat Button */}
      {!isOnMessagesPage && !isPopupOpen && (
        <FloatingChatButton
          onClick={handleOpenChat}
          unreadCount={unreadCount}
        />
      )}

      {/* Chat Popup */}
      <ChatPopup
        isOpen={isPopupOpen}
        onClose={handleCloseChat}
        onMinimize={handleMinimizeChat}
        onMaximize={handleMaximizeChat}
        recipientId={recipientId}
        recipientName={recipientName}
      />
    </>
  );
}