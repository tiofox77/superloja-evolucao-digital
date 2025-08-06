import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building, CreditCard } from 'lucide-react';

interface BankDetails {
  bank_name: string;
  account_number: string;
  iban: string;
  account_holder: string;
  swift_code: string;
  branch: string;
}

const BankSettingsForm: React.FC = () => {
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    account_number: '',
    iban: '',
    account_holder: '',
    swift_code: '',
    branch: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBankSettings();
  }, []);

  const loadBankSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'payment_bank_details')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setBankDetails(data.value as any);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações bancárias:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as configurações bancárias.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'payment_bank_details',
          value: bankDetails as any,
          description: 'Coordenadas bancárias para transferências'
        });

      if (error) throw error;

      toast({
        title: "✅ Configurações salvas",
        description: "As coordenadas bancárias foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar as configurações bancárias.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Coordenadas Bancárias
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure os dados bancários que aparecerão no checkout para transferências.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Nome do Banco *</Label>
              <Input
                id="bank_name"
                value={bankDetails.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                placeholder="Ex: BAI"
                required
              />
            </div>
            <div>
              <Label htmlFor="account_number">Número da Conta *</Label>
              <Input
                id="account_number"
                value={bankDetails.account_number}
                onChange={(e) => handleInputChange('account_number', e.target.value)}
                placeholder="Ex: 123456789"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="iban">IBAN *</Label>
            <Input
              id="iban"
              value={bankDetails.iban}
              onChange={(e) => handleInputChange('iban', e.target.value)}
              placeholder="Ex: AO06.0001.0000.1234.5678.9012.3"
              required
            />
          </div>

          <div>
            <Label htmlFor="account_holder">Titular da Conta *</Label>
            <Input
              id="account_holder"
              value={bankDetails.account_holder}
              onChange={(e) => handleInputChange('account_holder', e.target.value)}
              placeholder="Ex: SuperLoja Lda"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="swift_code">Código SWIFT</Label>
              <Input
                id="swift_code"
                value={bankDetails.swift_code}
                onChange={(e) => handleInputChange('swift_code', e.target.value)}
                placeholder="Ex: BAAIAOAI"
              />
            </div>
            <div>
              <Label htmlFor="branch">Agência/Filial</Label>
              <Input
                id="branch"
                value={bankDetails.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                placeholder="Ex: Luanda Central"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pré-visualização
            </h4>
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p><strong>Banco:</strong> {bankDetails.bank_name || 'Nome do banco'}</p>
              <p><strong>Conta:</strong> {bankDetails.account_number || 'Número da conta'}</p>
              <p><strong>IBAN:</strong> {bankDetails.iban || 'IBAN da conta'}</p>
              <p><strong>Titular:</strong> {bankDetails.account_holder || 'Titular da conta'}</p>
              {bankDetails.swift_code && <p><strong>SWIFT:</strong> {bankDetails.swift_code}</p>}
              {bankDetails.branch && <p><strong>Agência:</strong> {bankDetails.branch}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankSettingsForm;