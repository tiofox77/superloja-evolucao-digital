import * as React from 'react';
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

const LayoutContext = React.createContext<LayoutContextType>({
  layoutSettings: {},
  loading: true,
  refreshLayout: async () => {},
  getLayoutSetting: () => null
});

export const useLayout = () => {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout deve ser usado dentro de um LayoutProvider');
  }
  return context;
};

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layoutSettings, setLayoutSettings] = React.useState<LayoutSettings>({});
  const [loading, setLoading] = React.useState(true);

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

  React.useEffect(() => {
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