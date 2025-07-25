import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessagingInterface } from '../components/chat/MessagingInterface';

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
    <div className="h-screen flex flex-col">
      <MessagingInterface 
        className="flex-1" 
        recipientId={recipientId}
        recipientName={recipientName}
      />
    </div>
  );
};

export default Messages;
