-- ============================================
-- Supabase Schema for Connect Four Game
-- ============================================
-- 
-- ⚠️  IMPORTANT: Run this in Supabase SQL Editor
-- 
-- Steps:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor (left sidebar)
-- 3. Click "New Query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" or press Ctrl+Enter
--
-- DO NOT run this from application code!
-- ============================================

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id VARCHAR(255) NOT NULL,
    player2_id VARCHAR(255),
    bot_game BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'waiting', -- waiting, active, completed, forfeited
    winner VARCHAR(255),
    board_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    username VARCHAR(255) PRIMARY KEY,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game moves table (optional, for replay functionality)
CREATE TABLE IF NOT EXISTS game_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    column_index INTEGER NOT NULL,
    row_index INTEGER NOT NULL,
    move_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_wins ON leaderboard(games_won DESC);
CREATE INDEX IF NOT EXISTS idx_game_moves_game_id ON game_moves(game_id);

-- Enable Row Level Security (optional, for production)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now - adjust for production)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on leaderboard" ON leaderboard FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_moves" ON game_moves FOR ALL USING (true);

