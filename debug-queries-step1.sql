-- Query 1: Descobrir valores válidos do enum membro_tipo
SELECT unnest(enum_range(NULL::membro_tipo)) AS valores_validos;