import React from 'react';
import BankSettingsForm from '@/components/BankSettingsForm';

const BankSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações Bancárias</h1>
        <p className="text-muted-foreground">
          Gerencie as coordenadas bancárias que aparecem no checkout
        </p>
      </div>
      
      <BankSettingsForm />
    </div>
  );
};

export default BankSettings;