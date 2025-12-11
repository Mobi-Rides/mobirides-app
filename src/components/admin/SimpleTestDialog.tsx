import React from 'react';

interface SimpleTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleTestDialog: React.FC<SimpleTestDialogProps> = ({ isOpen, onClose }) => {
  console.log("SimpleTestDialog rendered with isOpen:", isOpen);
  
  if (!isOpen) return null;
  
  // Create a very obvious visual indicator
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '400px';
  div.style.left = '400px';
  div.style.background = 'purple';
  div.style.color = 'white';
  div.style.zIndex = '99996';
  div.style.padding = '20px';
  div.style.fontSize = '24px';
  div.innerHTML = 'SIMPLE TEST DIALOG IS OPEN - RENDERING';
  document.body.appendChild(div);
  setTimeout(() => document.body.removeChild(div), 5000);
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        border: '5px solid red',
        padding: '20px',
        zIndex: 100000,
        boxShadow: '0 0 100px rgba(0,0,0,0.9)'
      }}
    >
      <h1>SIMPLE TEST DIALOG</h1>
      <p>This is a simple test dialog that doesn't use the complex dialog component.</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};