import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export const useAdminAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async (session: Session | null) => {
      if (!session?.user) {
        navigate('/auth');
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Acesso direto para admin conhecido
      if (session.user.email === 'carlosfox1782@gmail.com') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error);
        navigate('/auth');
      }

      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await checkAdminAccess(session);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await checkAdminAccess(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { loading, isAdmin, user };
};