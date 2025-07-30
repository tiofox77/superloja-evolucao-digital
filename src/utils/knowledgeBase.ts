// Funções auxiliares para CRUD da base de conhecimento
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KnowledgeItem {
  id?: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  active: boolean;
}

// Adicionar novo conhecimento
export async function addKnowledge(knowledge: Omit<KnowledgeItem, 'id'>) {
  try {
    console.log('📚 Adicionando conhecimento:', knowledge);
    
    const { data, error } = await supabase
      .from('ai_knowledge_base')
      .insert({
        category: knowledge.category,
        question: knowledge.question.trim(),
        answer: knowledge.answer.trim(),
        keywords: knowledge.keywords.filter(k => k.trim()),
        priority: knowledge.priority,
        active: knowledge.active
      })
      .select();

    if (error) {
      console.error('❌ Erro ao adicionar:', error);
      throw error;
    }

    console.log('✅ Conhecimento adicionado:', data);
    toast.success('Conhecimento adicionado com sucesso!');
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao adicionar conhecimento:', error);
    toast.error('Erro ao adicionar conhecimento');
    throw error;
  }
}

// Editar conhecimento existente
export async function updateKnowledge(id: string, updates: Partial<KnowledgeItem>) {
  try {
    console.log('✏️ Editando conhecimento:', id, updates);
    
    const { data, error } = await supabase
      .from('ai_knowledge_base')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Erro ao editar:', error);
      throw error;
    }

    console.log('✅ Conhecimento editado:', data);
    toast.success('Conhecimento atualizado!');
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao editar conhecimento:', error);
    toast.error('Erro ao editar conhecimento');
    throw error;
  }
}

// Deletar conhecimento
export async function deleteKnowledge(id: string) {
  try {
    console.log('🗑️ Deletando conhecimento:', id);
    
    const { error } = await supabase
      .from('ai_knowledge_base')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao deletar:', error);
      throw error;
    }

    console.log('✅ Conhecimento deletado');
    toast.success('Conhecimento removido!');
    
  } catch (error) {
    console.error('❌ Erro ao deletar conhecimento:', error);
    toast.error('Erro ao deletar conhecimento');
    throw error;
  }
}

// Ativar/desativar conhecimento
export async function toggleKnowledgeActive(id: string, active: boolean) {
  try {
    console.log('🔄 Alterando status:', id, active);
    
    const { data, error } = await supabase
      .from('ai_knowledge_base')
      .update({ active })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Erro ao alterar status:', error);
      throw error;
    }

    console.log('✅ Status alterado:', data);
    toast.success(`Conhecimento ${active ? 'ativado' : 'desativado'}!`);
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao alterar status:', error);
    toast.error('Erro ao alterar status');
    throw error;
  }
}

// Salvar configurações do admin
export async function saveAdminSettings(settings: {
  adminFacebookId: string;
  adminBackupId: string;
  escalationKeywords: string;
  escalationTime: number;
  botEnabled: boolean;
  knowledgeBaseEnabled: boolean;
}) {
  try {
    console.log('💾 === SALVANDO CONFIGURAÇÕES ADMIN ===');
    console.log('📋 Configurações:', settings);

    const settingsToSave = [
      { key: 'bot_enabled', value: settings.botEnabled.toString(), description: 'Bot habilitado/desabilitado' },
      { key: 'knowledge_base_enabled', value: settings.knowledgeBaseEnabled.toString(), description: 'Base de conhecimento ativa' },
      { key: 'admin_facebook_id', value: settings.adminFacebookId.trim(), description: 'ID Facebook do admin principal' },
      { key: 'admin_backup_id', value: settings.adminBackupId.trim(), description: 'ID Facebook do admin backup' },
      { key: 'escalation_keywords', value: settings.escalationKeywords, description: 'Palavras-chave para escalation' },
      { key: 'escalation_time', value: settings.escalationTime.toString(), description: 'Tempo para escalation em minutos' }
    ];

    console.log('📦 Preparando para salvar:', settingsToSave);

    // Salvar usando upsert com debug
    const { data, error } = await supabase
      .from('ai_settings')
      .upsert(settingsToSave, { 
        onConflict: 'key',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error('❌ Erro SQL no salvamento:', error);
      throw error;
    }

    console.log('✅ Dados salvos no Supabase:', data);
    
    // Verificar se realmente salvou
    const { data: verificationData } = await supabase
      .from('ai_settings')
      .select('key, value')
      .in('key', settingsToSave.map(s => s.key));
    
    console.log('🔍 Verificação pós-salvamento:', verificationData);

    // Verificar especificamente o admin ID
    const adminIdSaved = verificationData?.find(item => item.key === 'admin_facebook_id');
    console.log('🎯 Admin ID verificação:', adminIdSaved);

    if (adminIdSaved?.value !== settings.adminFacebookId.trim()) {
      console.warn('⚠️ Admin ID não foi salvo corretamente!');
      console.log('Expected:', settings.adminFacebookId.trim());
      console.log('Actual:', adminIdSaved?.value);
    }

    toast.success('Configurações salvas com sucesso!');
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao salvar configurações admin:', error);
    toast.error('Erro ao salvar configurações');
    throw error;
  }
}