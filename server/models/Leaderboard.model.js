import { supabase } from '../config/Db.config.js';

const BOT_USERNAME = 'Bot';

export class LeaderboardModel {
  static async updateLeaderboard(winner, loser = null, isDraw = false) {
    try {
      if (winner === BOT_USERNAME) winner = null;
      if (loser === BOT_USERNAME) loser = null;

      if (isDraw) {
        if (winner) await this.incrementDraw(winner);
        if (loser) await this.incrementDraw(loser);
      } else if (winner) {
        await this.incrementWin(winner);
        if (loser) await this.incrementLoss(loser);
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }

  static async incrementWin(username) {
    if (!username || username === BOT_USERNAME) return;

    try {
      const { data: existing } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', username)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('leaderboard')
          .update({
            games_won: existing.games_won + 1,
            total_games: existing.total_games + 1,
            updated_at: new Date().toISOString()
          })
          .eq('username', username);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leaderboard')
          .insert({
            username,
            games_won: 1,
            games_lost: 0,
            games_drawn: 0,
            total_games: 1
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error incrementing win:', error);
      throw error;
    }
  }

  static async incrementLoss(username) {
    if (!username || username === BOT_USERNAME) return;

    try {
      const { data: existing } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', username)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('leaderboard')
          .update({
            games_lost: existing.games_lost + 1,
            total_games: existing.total_games + 1,
            updated_at: new Date().toISOString()
          })
          .eq('username', username);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leaderboard')
          .insert({
            username,
            games_won: 0,
            games_lost: 1,
            games_drawn: 0,
            total_games: 1
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error incrementing loss:', error);
      throw error;
    }
  }

  static async incrementDraw(username) {
    if (!username || username === BOT_USERNAME) return;

    try {
      const { data: existing } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', username)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('leaderboard')
          .update({
            games_drawn: existing.games_drawn + 1,
            total_games: existing.total_games + 1,
            updated_at: new Date().toISOString()
          })
          .eq('username', username);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leaderboard')
          .insert({
            username,
            games_won: 0,
            games_lost: 0,
            games_drawn: 1,
            total_games: 1
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error incrementing draw:', error);
      throw error;
    }
  }

  static async getLeaderboard(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .neq('username', BOT_USERNAME)
        .order('games_won', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  static async getPlayerStats(username) {
    if (!username || username === BOT_USERNAME) return null;

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  }
}
