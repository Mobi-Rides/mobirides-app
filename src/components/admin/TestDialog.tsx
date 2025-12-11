import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestDialog: React.FC<TestDialogProps> = ({ isOpen, onClose }) => {
  console.log("TestDialog rendered with isOpen:", isOpen);
  
  // Create a very obvious visual indicator if the dialog is being rendered
  if (isOpen) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '200px';
    div.style.left = '200px';
    div.style.background = 'blue';
    div.style.color = 'white';
    div.style.zIndex = '99998';
    div.style.padding = '20px';
    div.style.fontSize = '24px';
    div.innerHTML = 'TEST DIALOG IS OPEN - RENDERING';
    document.body.appendChild(div);
    setTimeout(() => document.body.removeChild(div), 5000);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div style={{ position: 'fixed', top: 100, left: 100, background: 'purple', color: 'white', zIndex: 99999, padding: '20px' }}>
        TEST DIALOG RENDERED
      </div>
      <DialogContent className="sm:max-w-[425px]" style={{ border: '5px solid green', zIndex: 9999, position: 'fixed', backgroundColor: 'orange' }}>
        <DialogHeader>
          <DialogTitle>TEST DIALOG - {isOpen ? "OPEN" : "CLOSED"}</DialogTitle>
        </DialogHeader>
        <div style={{ padding: '20px', background: 'pink' }}>
          <h1>TEST DIALOG CONTENT</h1>
          <p>This is a test dialog to see if dialogs are working at all.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};