-- Inserir configurações bancárias padrão
INSERT INTO settings (key, value, description) VALUES 
(
  'payment_bank_details', 
  '{
    "bank_name": "BAI",
    "account_number": "123456789",
    "iban": "AO06.0001.0000.1234.5678.9012.3",
    "account_holder": "SuperLoja Lda",
    "swift_code": "",
    "branch": ""
  }'::jsonb,
  'Coordenadas bancárias para transferências'
)
ON CONFLICT (key) DO NOTHING;