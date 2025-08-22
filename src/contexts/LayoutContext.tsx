import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LayoutSettings {
  [key: string]: any;
}

interface LayoutContextType {
  layoutSettings: LayoutSettings;
  loading: boolean;
  refreshLayout: () => Promise<void>;
  getLayoutSetting: (sectionName: string) => any;
}

const LayoutContext = createContext<LayoutContextType>({
  layoutSettings: {},
  loading: true,
  refreshLayout: async () => {},
  getLayoutSetting: () => null
});

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({});
  const [loading, setLoading] = useState(true);

  const refreshLayout = async () => {
    try {
      const { data, error } = await supabase
        .from('layout_settings')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const settingsMap: LayoutSettings = {};
      data?.forEach(setting => {
        settingsMap[setting.section_name] = setting.content;
      });
      
      setLayoutSettings(settingsMap);
    } catch (error) {
      console.error('Erro ao carregar configurações de layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLayoutSetting = (sectionName: string) => {
    return layoutSettings[sectionName] || null;
  };

  useEffect(() => {
    refreshLayout();
  }, []);

  return (
    <LayoutContext.Provider value={{ 
      layoutSettings, 
      loading, 
      refreshLayout,
      getLayoutSetting 
    }}>
      {children}
    </LayoutContext.Provider>
  );
};