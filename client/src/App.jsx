import { useState, useEffect } from 'react'
import GameBoard from './components/GameBoard'
import UsernameForm from './components/UsernameForm'
import Leaderboard from './components/Leaderboard'

function App() {
  const [username, setUsername] = useState('')
  const [gameState, setGameState] = useState(null)
  const [status, setStatus] = useState('idle') // idle, waiting, playing, finished
  const [message, setMessage] = useState('')
  const [leaderboard, setLeaderboard] = useState([])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard')
      const data = await response.json()
      if (data.success) {
        setLeaderboard(data.data)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  useEffect(() => {
    // Fetch leaderboard on mount
    (async () => {
      try {
        const response = await fetch('/api/leaderboard')
        const data = await response.json()
        if (data.success) {
          setLeaderboard(data.data)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      }
    })()
  }, [])

  const handleUsernameSubmit = (name) => {
    setUsername(name)
    setStatus('waiting')
    setMessage('Connecting...')
  }

  const handleGameStateUpdate = (state) => {
    setGameState(state)
    if (state.status === 'active') {
      setStatus('playing')
      setMessage('')
    } else if (state.status === 'completed') {
      setStatus('finished')
      if (state.winner === 'draw') {
        setMessage('Game ended in a draw!')
      } else {
        const result = state.result
        setMessage(result === 'win' ? 'You won! 🎉' : 'You lost 😢')
      }
      fetchLeaderboard()
    }
  }

  const handleGameStart = (state) => {
    setGameState(state)
    setStatus('playing')
    setMessage(`Playing against ${state.opponent}`)
  }

  const handleWaiting = (msg) => {
    setStatus('waiting')
    setMessage(msg)
  }

  const handleError = (errorMsg) => {
    setMessage(`Error: ${errorMsg}`)
  }

  const handleNewGame = () => {
    setGameState(null)
    setStatus('idle')
    setMessage('')
    setUsername('')
  }

  if (!username) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            🎯 Connect Four
          </h1>
          <p className="text-center text-neutral-500 mb-8 text-lg">
            Drop your discs and get 4 in a row!
          </p>
          
          <UsernameForm onSubmit={handleUsernameSubmit} />
          
          <Leaderboard data={leaderboard} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            🎯 Connect Four
          </h1>
          <button
            onClick={handleNewGame}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-200 text-neutral-500 rounded-lg font-semibold transition-colors"
          >
            New Game
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl font-semibold text-center ${
            message.includes('won') 
              ? 'bg-green-100 text-green-700 border-2 border-green-300' 
              : message.includes('lost') || message.includes('Error')
              ? 'bg-red-100 text-red-700 border-2 border-red-300'
              : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
          }`}>
            {message}
          </div>
        )}

        {(status === 'waiting' || status === 'playing') && (
          <GameBoard
            gameState={gameState}
            username={username}
            onGameStateUpdate={handleGameStateUpdate}
            onGameStart={handleGameStart}
            onWaiting={handleWaiting}
            onError={handleError}
          />
        )}

        {status === 'finished' && (
          <div className="py-12 text-center">
            <button
              onClick={handleNewGame}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Play Again
            </button>
          </div>
        )}

        <Leaderboard data={leaderboard} />
      </div>
    </div>
  )
}

export default App
