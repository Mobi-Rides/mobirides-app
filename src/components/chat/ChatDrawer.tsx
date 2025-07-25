import React, { useEffect, useRef, useState } from 'react';
import { X, Smile, Paperclip } from 'lucide-react';

const EMOJI_LIST = ['😀', '😂', '😍', '👍', '🎉', '🚗', '😎'];

const ChatDrawer = ({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  messages = [],
  onSend,
  onFileUpload,
  typing,
  replyTarget,
}) => {
  const drawerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Focus trap and ESC support
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      const handleKey = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [isOpen, onClose]);

  // Handle file upload
  const handleFileButton = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    e.target.value = '';
  };

  // Handle emoji picker
  const handleEmojiButton = () => {
    setShowEmoji((v) => !v);
  };
  const handleEmojiSelect = (emoji) => {
    setInputValue((v) => v + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  // Handle send
  const handleSubmit = (e) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (value) {
      onSend(value, replyTarget);
      setInputValue("");
    }
  };

  return (
    <div
      aria-label="Chat Drawer"
      role="dialog"
      aria-modal="true"
      className={`fixed z-50 transition-transform duration-300 ease-in-out bg-white dark:bg-gray-900 shadow-2xl border-l-4 border-blue-500 dark:border-blue-400 flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        right-0 top-0 h-full w-full max-w-md md:w-[400px] md:mr-8
        md:bottom-auto md:right-0 md:top-0 md:h-full
        md:rounded-2xl
        ${isOpen ? '' : 'pointer-events-none'}`}
      style={{
        transform: isOpen
          ? 'translateX(0)'
          : 'translateX(100%)',
        ...(window.innerWidth < 768 && isOpen
          ? { bottom: 0, top: 'auto', left: 0, right: 0, height: '60%', marginRight: 0 }
          : { marginRight: '2rem' }),
      }}
      ref={drawerRef}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-500 dark:border-blue-400 bg-gradient-to-r from-blue-500/90 to-blue-400/80 dark:from-blue-700 dark:to-blue-500 sticky top-0 z-10 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-200 border-2 border-blue-400">
            {receiverName?.[0] || '?'}
          </div>
          <div>
            <div className="font-semibold text-base text-white drop-shadow">{receiverName || 'Chat'}</div>
            {typing && <div className="text-xs text-blue-100 animate-pulse">Typing…</div>}
          </div>
        </div>
        <button
          aria-label="Close chat"
          className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No messages yet.</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}> 
              <div className={`rounded-xl px-4 py-2 max-w-xs break-words shadow-md transition-all
                ${msg.isOwn
                  ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-blue-100 dark:border-blue-900'}
              `}>
                {msg.content}
                {msg.file && (
                  <a href={msg.file.url} target="_blank" rel="noopener noreferrer" className="block mt-1 text-xs underline">{msg.file.name}</a>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                {msg.timestamp && <span>{msg.timestamp}</span>}
                {msg.read && <span className="ml-1 text-green-500">✓✓</span>}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Input */}
      <form
        className="flex flex-col gap-1 p-3 border-t border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 relative rounded-b-2xl"
        onSubmit={handleSubmit}
      >
        {/* Reply preview */}
        {replyTarget && (
          <div className="flex items-center gap-2 mb-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900 text-xs text-blue-900 dark:text-blue-100">
            <div className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center font-bold text-blue-700 dark:text-blue-100">
              {replyTarget.senderName?.[0] || '?'}
            </div>
            <span className="font-semibold">{replyTarget.senderName || 'User'}</span>
            <span className="truncate max-w-[120px]">{replyTarget.content.length > 40 ? replyTarget.content.slice(0, 40) + '…' : replyTarget.content}</span>
            <button type="button" className="ml-2 text-blue-500 hover:text-blue-700" aria-label="Cancel reply" onClick={() => onSend('', null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 h-12">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button type="button" aria-label="Attach file" className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition h-12 flex items-center" onClick={handleFileButton}>
            <Paperclip className="w-5 h-5 text-blue-400" />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message…"
            className="flex-1 border rounded px-3 h-12 self-stretch focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 dark:bg-gray-800 dark:text-gray-100 transition text-base"
            aria-label="Type a message"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
          <div className="relative h-12 flex items-center">
            <button type="button" aria-label="Emoji" className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition h-12 flex items-center" onClick={handleEmojiButton}>
              <Smile className="w-5 h-5 text-blue-400" />
            </button>
            {showEmoji && (
              <div className="absolute bottom-10 right-0 bg-white dark:bg-gray-800 border rounded shadow p-2 flex gap-1 z-20">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-lg hover:bg-blue-100 dark:hover:bg-blue-700 rounded p-1"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary px-4 h-12 self-stretch flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold rounded transition text-base" style={{minWidth:'64px', lineHeight: '1.5'}}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
export default ChatDrawer;
export { ChatDrawer };