import React, { useState } from 'react';
import { Search, Plus, Phone, Video, Info, MoreVertical, Paperclip, Send, Mic } from 'lucide-react';

const MessagingApp = () => {
  const [selectedChat, setSelectedChat] = useState('boitumelo');
  const [message, setMessage] = useState('');

  const conversations = [
    {
      id: 'boitumelo',
      name: 'Boitumel...',
      avatar: 'B',
      lastMessage: 'You: fr',
      time: 'about 22 hours ago',
      unread: 3,
      isActive: true
    },
    {
      id: 'arnold',
      name: 'Arnold Balhoen',
      avatar: 'A',
      lastMessage: 'You: yoh',
      time: '3 days ago',
      unread: 1,
      isActive: false
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'other',
      content: 'hi',
      time: '21:29',
      date: 'July 20, 2025'
    },
    {
      id: 2,
      sender: 'me',
      content: 'hi',
      time: '16:33',
      date: 'July 21, 2025'
    },
    {
      id: 3,
      sender: 'other',
      content: '😊',
      time: '20:48',
      date: 'July 21, 2025'
    },
    {
      id: 4,
      sender: 'other',
      content: '😊',
      time: '00:22',
      date: 'July 23, 2025'
    },
    {
      id: 5,
      sender: 'other',
      content: 'scheki',
      time: '00:31',
      date: 'July 23, 2025'
    },
    {
      id: 6,
      sender: 'me',
      content: 'fr',
      time: '21:29',
      date: 'July 23, 2025'
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message logic here
      setMessage('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <button className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700">
              <Plus size={16} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedChat(conv.id)}
              className={`p-4 cursor-pointer hover:bg-gray-700 ${
                selectedChat === conv.id ? 'bg-purple-600/20 border-l-4 border-purple-600' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-semibold">
                    {conv.avatar}
                  </div>
                  {conv.isActive && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{conv.name}</h3>
                    <span className="text-xs text-gray-400">{conv.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <span className="bg-purple-600 text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-semibold">
                  B
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>
              <div>
                <h2 className="font-semibold">Boitumelo Khumalo</h2>
                <p className="text-sm text-gray-400">Offline</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-700 rounded-full">
                <Search size={20} />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-full">
                <Phone size={20} />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-full">
                <Video size={20} />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-full">
                <Info size={20} />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-full">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const showDate = index === 0 || messages[index - 1].date !== msg.date;
            
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center text-xs text-gray-500 my-4">
                    {msg.date}
                  </div>
                )}
                
                <div className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.sender === 'me'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
                
                <div className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} mt-1`}>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-700 rounded-full">
              <Paperclip size={20} className="text-gray-400" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-gray-700 rounded-full px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-600"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-600 rounded-full">
                {message.trim() ? (
                  <Send size={16} className="text-purple-400" onClick={handleSendMessage} />
                ) : (
                  <Mic size={16} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingApp;