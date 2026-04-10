import { createContext, useContext } from 'react';

interface TutorialContextValue {
  restart: () => void;
}

export const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorialContext() {
  return useContext(TutorialContext);
}
