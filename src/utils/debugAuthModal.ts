// Debug utility to track AuthModal instances and prevent duplicates
let authModalCount = 0;
let modalStack: string[] = [];

export const debugAuthModal = {
  open: (componentName: string) => {
    authModalCount++;
    modalStack.push(componentName);
    console.log(`🔐 AuthModal opened by ${componentName}. Total open: ${authModalCount}`);
    console.log(`📋 Current modal stack:`, modalStack);
    
    // Check for potential duplicates
    if (authModalCount > 1) {
      console.warn(`⚠️ WARNING: Multiple modals detected! This might cause UI issues.`);
      console.warn(`🔍 Modal stack:`, modalStack);
    }
  },
  
  close: (componentName: string) => {
    authModalCount = Math.max(0, authModalCount - 1);
    modalStack = modalStack.filter(name => name !== componentName);
    console.log(`🔐 AuthModal closed by ${componentName}. Total open: ${authModalCount}`);
    console.log(`📋 Current modal stack:`, modalStack);
  },
  
  getCount: () => authModalCount,
  
  getStack: () => [...modalStack],
  
  reset: () => {
    authModalCount = 0;
    modalStack = [];
    console.log('🔐 AuthModal count reset to 0');
  },
  
  // Debug function to check for duplicate components
  checkForDuplicates: () => {
    const componentCounts: { [key: string]: number } = {};
    modalStack.forEach(name => {
      componentCounts[name] = (componentCounts[name] || 0) + 1;
    });
    
    const duplicates = Object.entries(componentCounts).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.error(`❌ DUPLICATE COMPONENTS DETECTED:`, duplicates);
    }
    
    return duplicates;
  }
};

// Hook to track AuthModal usage
export const useAuthModalDebug = (componentName: string) => {
  const openModal = () => {
    debugAuthModal.open(componentName);
  };
  
  const closeModal = () => {
    debugAuthModal.close(componentName);
  };
  
  return { openModal, closeModal };
};

// Global function to check current state
(window as any).debugAuthModal = debugAuthModal; 