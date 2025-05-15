import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(defaultTheme === 'dark');

  useEffect(() => {
    if (defaultTheme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      
      // Listen for changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      
      if (mediaQuery?.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    } else {
      setIsDarkMode(defaultTheme === 'dark');
    }
  }, [defaultTheme]);

  const { defaultAlgorithm, darkAlgorithm } = theme;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeProvider;