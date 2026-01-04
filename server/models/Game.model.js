import { supabase } from '../config/Db.config.js';

export class GameModel {
  static async saveGame(game) {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          id: game.id,
          player1_id: game.player1?.username || null,
          player2_id: game.player2?.username || null,
          bot_game: game.isBotGame,
          status: game.status,
          winner: game.winner,
          board_state: game.board,
          created_at: game.createdAt.toISOString(),
          updated_at: game.updatedAt.toISOString(),
          completed_at: game.status === 'completed' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving game:', error);
      throw error;
    }
  }

  static async getGameById(gameId) {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }

  static async getGamesByPlayer(username) {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .or(`player1_id.eq.${username},player2_id.eq.${username}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching player games:', error);
      return [];
    }
  }

  static async updateGameStatus(gameId, status, winner = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (winner) {
        updateData.winner = winner;
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  }
}
