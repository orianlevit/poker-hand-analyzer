import { supabase } from '../lib/supabase';
import { HandData } from '../types/hand';

export const handService = {
  async saveHand(handData: HandData) {
    try {
      const { data, error } = await supabase
        .from('hands')
        .insert([
          {
            input: handData,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving hand:', error);
      throw error;
    }
  },

  async getHands() {
    try {
      const { data, error } = await supabase
        .from('hands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching hands:', error);
      throw error;
    }
  }
}; 