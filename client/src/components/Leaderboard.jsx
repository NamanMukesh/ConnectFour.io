import { useEffect, useState } from 'react'

function Leaderboard({ data: initialData }) {
  const [data, setData] = useState(initialData || [])

  useEffect(() => {
    setData(initialData || [])
  }, [initialData])

  if (!data || data.length === 0) {
    return (
      <div className="mt-10 bg-neutral-50 rounded-2xl p-6 border-2 border-neutral-200">
        <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          🏆 Leaderboard
        </h2>
        <p className="text-center text-neutral-500">No players yet. Be the first to play!</p>
      </div>
    )
  }

  return (
    <div className="mt-10 bg-gradient-to-br from-neutral-50 to-white rounded-2xl p-6 border-2 border-neutral-200 shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
        🏆 Leaderboard
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
              <th className="px-4 py-3 text-left rounded-tl-xl font-bold">Rank</th>
              <th className="px-4 py-3 text-left font-bold">Player</th>
              <th className="px-4 py-3 text-center font-bold">Wins</th>
              <th className="px-4 py-3 text-center font-bold">Losses</th>
              <th className="px-4 py-3 text-center font-bold">Draws</th>
              <th className="px-4 py-3 text-center rounded-tr-xl font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((player, index) => (
              <tr
                key={player.username}
                className={`border-b border-neutral-200 transition-colors ${
                  index === 0 
                    ? 'bg-yellow-50 font-bold' 
                    : 'hover:bg-white'
                }`}
              >
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    index === 0 
                      ? 'bg-yellow-400 text-yellow-900' 
                      : index === 1
                      ? 'bg-neutral-200 text-neutral-500'
                      : index === 2
                      ? 'bg-yellow-500 text-white'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-primary-500">{player.username}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                    {player.games_won || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold">
                    {player.games_lost || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-neutral-200 text-neutral-500 rounded-full font-bold">
                    {player.games_drawn || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-bold text-primary-500">
                  {player.total_games || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Leaderboard
