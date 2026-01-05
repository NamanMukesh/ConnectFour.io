const metrics = {
  gamesPlayed: 0,
  totalDuration: 0,
  wins: {},
  moves: {},
};

export function processAnalyticsEvent(event) {
  const { type, payload } = event;

  switch (type) {
    case 'GAME_STARTED':
      metrics.gamesPlayed++;
      break;

    case 'MOVE_MADE':
      metrics.moves[payload.player] =
        (metrics.moves[payload.player] || 0) + 1;
      break;

    case 'GAME_ENDED':
      metrics.totalDuration += payload.duration;

      if (payload.winner !== 'draw') {
        metrics.wins[payload.winner] =
          (metrics.wins[payload.winner] || 0) + 1;
      }
      break;
  }

  console.log('Analytics Snapshot:', metrics);
}
