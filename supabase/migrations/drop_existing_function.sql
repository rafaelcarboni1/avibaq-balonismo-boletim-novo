-- Dropar função existente para permitir recriação com novo tipo de retorno
DROP FUNCTION IF EXISTS get_current_user_table_id();

SELECT 'Função get_current_user_table_id dropada com sucesso' as status;