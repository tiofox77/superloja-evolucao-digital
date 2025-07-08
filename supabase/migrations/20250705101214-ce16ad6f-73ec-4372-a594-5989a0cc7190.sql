-- Remover política restritiva
DROP POLICY IF EXISTS "Perfis são visíveis para todos autenticados" ON public.profiles;

-- Criar política mais permissiva para SELECT
CREATE POLICY "Usuários podem ver perfis quando autenticados" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Também permitir que usuários vejam seu próprio perfil e perfis por email
CREATE POLICY "Usuários podem ver perfis por email ou próprio perfil" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  auth.uid() IS NOT NULL
);