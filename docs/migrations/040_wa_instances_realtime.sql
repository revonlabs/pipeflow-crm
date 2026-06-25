-- Migration 040: WhatsApp Monitor — Sprint 5.5 (Realtime para wa_instances)
-- Habilita Realtime em wa_instances para a tela de gestão de instâncias
-- refletir o status (qr_pending → connected) assim que o worker processa o
-- evento connection.update, sem precisar de polling no client.
--
-- Checklist aplicada (ver memória do projeto, wa-realtime-postgres-changes-checklist):
-- wa_instances tem policy de DELETE (migration 023) — o client assina apenas
-- "UPDATE" explicitamente, nunca "*", evitando o vazamento de DELETE que RLS
-- não cobre em postgres_changes.

SET search_path = '';

ALTER PUBLICATION supabase_realtime ADD TABLE public.wa_instances;
