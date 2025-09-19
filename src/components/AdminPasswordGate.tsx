import React, { useState } from 'react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

export const AdminPasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem('adminUnlocked') === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      localStorage.setItem('adminUnlocked', 'true');
      setUnlocked(true);
    } else {
      setError('Incorrect password');
    }
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-gray-900 text-white">
        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded shadow-lg flex flex-col items-center">
          <label className="mb-2 text-lg font-semibold">Enter admin password:</label>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="mb-2 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold">Unlock</button>
          {error && <div className="text-red-400 mt-2">{error}</div>}
        </form>
      </div>
    );
  }

  return <>{children}</>;
}; 