export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  edited?: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
  status?: 'sent' | 'delivered' | 'read';
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  sender_id?: string;
  created_at?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  type: 'direct' | 'group';
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  timestamp: Date;
}