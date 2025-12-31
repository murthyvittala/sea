import { supabase } from './supabase';

export async function getAgents() {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*');
  if (error) throw error;
  return data;
}
