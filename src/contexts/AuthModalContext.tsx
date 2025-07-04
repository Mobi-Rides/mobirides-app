import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import { debugAuthModal } from '@/utils/debugAuthModal';

interface AuthModalContextType {
  isOpen: boolean;
  openModal: (source: string) => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

interface AuthModalProviderProps {
  children: ReactNode;
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (source: string) => {
    console.log(`🔐 Global AuthModal opened by ${source}`);
    debugAuthModal.open(`Global-${source}`);
    setIsOpen(true);
  };

  const closeModal = () => {
    console.log('🔐 Global AuthModal closed');
    debugAuthModal.close('Global');
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={closeModal}
        defaultTab="signin"
      />
    </AuthModalContext.Provider>
  );
}; 