// Application configuration
export const config = {
  port: process.env.PORT || 6000,
  matchmakingTimeout: 10000, // 10 seconds
  reconnectionTimeout: 30000, // 30 seconds
  boardRows: 6,
  boardCols: 7,
  winLength: 4,
};


