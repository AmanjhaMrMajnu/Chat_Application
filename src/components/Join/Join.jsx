import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

const Join = () => {
  const [name,setName] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.name) setName(user.name);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim() || !room.trim()) {
      setError('Both name and room are required');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    if (room.trim().length < 2) {
      setError('Room name must be at least 2 characters long');
      return;
    }

    setError('');
    navigate(`/chat?name=${encodeURIComponent(name.trim())}&room=${encodeURIComponent(room.trim())}`);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
        <h2 className="text-white text-4xl font-bold text-center mb-8 tracking-wide drop-shadow-md">
          ChatGram
        </h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 mb-6 rounded-lg text-sm text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              placeholder="Username" 
              className="w-full px-5 py-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-black/30 transition-all duration-300" 
              type="text" 
              value={name}
              onChange={(event)=> setName(event.target.value)}
              maxLength={20}
            />
          </div>
          <div>
            <input 
              placeholder="Room Name" 
              className="w-full px-5 py-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-black/30 transition-all duration-300" 
              type="text" 
              value={room}
              onChange={(event)=> setRoom(event.target.value)}
              maxLength={30}
            />
          </div>
          <button 
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm" 
            type="submit"
            disabled={!name.trim() || !room.trim()}
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  )
}

export default Join;