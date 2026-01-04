import { useState } from 'react'

function UsernameForm({ onSubmit }) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim()) {
      onSubmit(username.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-10">
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="px-6 py-4 border-2 border-neutral-300 rounded-xl text-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all min-w-[250px]"
          maxLength={20}
          required
        />
        <button
          type="submit"
          className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 whitespace-nowrap"
        >
          Start Game
        </button>
      </div>
    </form>
  )
}

export default UsernameForm
