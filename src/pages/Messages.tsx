import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessagingInterface } from '../components/chat/MessagingInterface';
import { MessagingErrorBoundary } from '../components/chat/MessagingErrorBoundary';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';

const Messages = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Log the state received from navigation for debugging
    if (location.state) {
      console.log('Received state from navigation:', location.state);
      // Here we would handle the recipientId and recipientName
      // to start a new conversation with the car owner
    }
  }, [location]);

  // Extract recipientId and recipientName from location state if available
  const recipientId = location.state?.recipientId;
  const recipientName = location.state?.recipientName;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        searchQuery=""
        onSearchChange={() => {}}
        onFiltersChange={() => {}}
      />
      <div className="flex-1 flex flex-col pb-16">
        <MessagingErrorBoundary>
          <MessagingInterface 
            className="flex-1" 
            recipientId={recipientId}
            recipientName={recipientName}
          />
        </MessagingErrorBoundary>
      </div>
      <Navigation />
    </div>
  );
};

export default Messages;
