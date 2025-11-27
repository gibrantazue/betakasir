import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppContent, DEFAULT_CONTENT, subscribeToContent } from '../services/contentService';

interface ContentContextType {
  content: AppContent;
  loading: boolean;
}

const ContentContext = createContext<ContentContextType>({
  content: DEFAULT_CONTENT,
  loading: true,
});

export const useContent = () => useContext(ContentContext);

interface ContentProviderProps {
  children: ReactNode;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [content, setContent] = useState<AppContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Setting up content realtime listener...');
    
    const unsubscribe = subscribeToContent(
      (updatedContent) => {
        console.log('📝 Content updated:', updatedContent);
        setContent(updatedContent);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Content subscription error:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔴 Cleaning up content listener...');
      unsubscribe();
    };
  }, []);

  return (
    <ContentContext.Provider value={{ content, loading }}>
      {children}
    </ContentContext.Provider>
  );
};
