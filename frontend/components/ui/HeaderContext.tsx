'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HeaderContextType {
  title: string;
  subtitle?: string;
  actionButton?: ReactNode;
  setHeader: (title: string, subtitle?: string, actionButton?: ReactNode) => void;
  clearHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Dashboard');
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined);
  const [actionButton, setActionButton] = useState<ReactNode | undefined>(undefined);

  const setHeader = useCallback((newTitle: string, newSubtitle?: string, newActionButton?: ReactNode) => {
    setTitle(newTitle);
    setSubtitle(newSubtitle);
    setActionButton(newActionButton);
  }, []);

  const clearHeader = useCallback(() => {
    setTitle('Dashboard');
    setSubtitle(undefined);
    setActionButton(undefined);
  }, []);

  return (
    <HeaderContext.Provider value={{ title, subtitle, actionButton, setHeader, clearHeader }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}

