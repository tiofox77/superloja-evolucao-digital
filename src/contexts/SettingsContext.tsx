import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Settings {
  store_name: string;
  store_description: string;
  logo_url: string | null;
  favicon_url: string | null;
  contact_email: string;
  contact_phone: string;
  address: string;
  website: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  store_name: 'SuperLoja',
  store_description: 'A melhor loja de eletrônicos de Angola',
  logo_url: null,
  favicon_url: null,
  contact_email: 'contato@superloja.com',
  contact_phone: '+244 942 705 533',
  address: 'Luanda, Angola',
  website: '',
  facebook: '',
  instagram: '',
  whatsapp: ''
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {}
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('SettingsProvider: Starting component initialization');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  console.log('SettingsProvider: State initialized');

  const refreshSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      
      const settingsMap: any = { ...defaultSettings };
      data?.forEach(setting => {
        const value = setting.value as any;
        if (setting.key === 'store_info') {
          settingsMap.store_name = value.name || defaultSettings.store_name;
          settingsMap.store_description = value.description || defaultSettings.store_description;
          settingsMap.logo_url = value.logo_url;
          settingsMap.favicon_url = value.favicon_url;
        } else if (setting.key === 'contact_info') {
          settingsMap.contact_email = value.email || defaultSettings.contact_email;
          settingsMap.contact_phone = value.phone || defaultSettings.contact_phone;
          settingsMap.address = value.address || defaultSettings.address;
        } else if (setting.key === 'business_info') {
          settingsMap.website = value.website || '';
          settingsMap.facebook = value.social_media?.facebook || '';
          settingsMap.instagram = value.social_media?.instagram || '';
          settingsMap.whatsapp = value.social_media?.whatsapp || '';
        }
      });
      
      setSettings(settingsMap);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};