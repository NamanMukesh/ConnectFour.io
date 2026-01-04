import { useState, useEffect, useRef } from 'react'

function GameBoard({
  gameState: initialGameState,
  username,
  onGameStateUpdate,
  onGameStart,
  onWaiting,
  onError
}) {
  const [gameState, setGameState] = useState(initialGameState)
  const [board, setBoard] = useState(initialGameState?.board || [])

  /* ================= REFS ================= */

  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const shouldReconnectRef = useRef(true)

  // Dynamic values via refs (NO re-renders)
  const usernameRef = useRef(username)
  const onGameStateUpdateRef = useRef(onGameStateUpdate)
  const onGameStartRef = useRef(onGameStart)
  const onWaitingRef = useRef(onWaiting)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    usernameRef.current = username
    onGameStateUpdateRef.current = onGameStateUpdate
    onGameStartRef.current = onGameStart
    onWaitingRef.current = onWaiting
    onErrorRef.current = onError
  }, [username, onGameStateUpdate, onGameStart, onWaiting, onError])

  /* ================= MESSAGE HANDLER ================= */

  function handleMessage(message) {
    switch (message.type) {
      case 'WAITING_FOR_OPPONENT':
        onWaitingRef.current('Waiting for opponent...')
        break

      case 'GAME_STARTED': {
        const state = message.payload
        setGameState(state)
        setBoard(state.board || [])
        onGameStartRef.current(state)
        break
      }

      case 'GAME_UPDATE': {
        const state = message.payload
        const newBoard = state.board.map(row => [...row])
        setBoard(newBoard)
        setGameState(prev => ({ ...prev, ...state, board: newBoard }))
        onGameStateUpdateRef.current({ ...state, board: newBoard })
        break
      }

      case 'GAME_OVER':
        setGameState(message.payload)
        setBoard(message.payload.board || [])
        onGameStateUpdateRef.current(message.payload)
        break

      case 'ERROR':
        onErrorRef.current(message.payload?.message || 'Server error')
        break

      default:
        console.log('Unknown WS message:', message)
    }
  }

  /* ================= WEBSOCKET ================= */

  useEffect(() => {
    shouldReconnectRef.current = true

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.hostname
    const port = import.meta.env.DEV ? '3001' : window.location.port
    const wsUrl = `${protocol}://${host}:${port}/ws`

    console.log('🔌 Connecting WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('✅ WebSocket connected')

      ws.send(JSON.stringify({
        type: 'JOIN_GAME',
        payload: { username: usernameRef.current }
      }))
    }

    ws.onmessage = event => {
      try {
        const msg = JSON.parse(event.data)
        handleMessage(msg)
      } catch (err) {
        console.error('Invalid WS message', err)
      }
    }

    ws.onerror = () => {
      onErrorRef.current('WebSocket error')
    }

    ws.onclose = event => {
      console.log('🔌 WebSocket closed', event.code)

      if (shouldReconnectRef.current && event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    }

    return () => {
      shouldReconnectRef.current = false
      clearTimeout(reconnectTimeoutRef.current)
      ws.close(1000, 'Component unmounted')
    }
  }, []) // 🔥 RUNS ONCE ONLY

  /* ================= GAME ACTIONS ================= */

  function handleColumnClick(col) {
    if (!gameState || gameState.status !== 'active') return
    if (gameState.currentPlayer !== gameState.yourPlayer) return
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'MAKE_MOVE',
      payload: {
        gameId: gameState.id,
        column: col
      }
    }))
  }

  /* ================= UI ================= */

  /* ================= UI ================= */

  if (!gameState || !board.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-lg font-semibold text-gray-600">
          Waiting for opponent...
        </p>
      </div>
    )
  }

  const isYourTurn =
    gameState.status === 'active' &&
    gameState.currentPlayer === gameState.yourPlayer

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Turn Indicator */}
      <div
        className={`px-6 py-2 rounded-full text-white font-semibold transition-all ${
          isYourTurn
            ? 'bg-green-500 animate-pulse'
            : 'bg-gray-400'
        }`}
      >
        {isYourTurn ? 'Your Turn' : "Opponent's Turn"}
      </div>

      {/* Game Board */}
      <div className="bg-blue-700 p-4 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }, (_, col) => (
            <div
              key={col}
              className={`flex flex-col gap-3 p-1 rounded-lg transition ${
                isYourTurn ? 'hover:bg-blue-600 cursor-pointer' : ''
              }`}
              onClick={() => isYourTurn && handleColumnClick(col)}
            >
              {Array.from({ length: 6 }, (_, row) => {
                const cell = board[row][col]

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`
                      w-14 h-14 rounded-full
                      flex items-center justify-center
                      shadow-inner transition-all duration-300
                      ${
                        cell === 0
                          ? 'bg-blue-100'
                          : cell === 1
                          ? 'bg-red-500 shadow-lg'
                          : 'bg-yellow-400 shadow-lg'
                      }
                    `}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GameBoard
