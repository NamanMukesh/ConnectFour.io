// Leaderboard controller
import { LeaderboardModel } from '../models/Leaderboard.model.js';

export async function getLeaderboard(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await LeaderboardModel.getLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
}

export async function getPlayerStats(req, res) {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    const stats = await LeaderboardModel.getPlayerStats(username);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch player stats' });
  }
}

