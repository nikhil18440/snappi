import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleCreateOrJoin = () => {
    if (roomId.trim() !== '') {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-semibold mb-6">Snappi</h1>
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room Number"
        className="border rounded-lg px-4 py-2 mb-4 w-full max-w-xs"
      />
      <button
        onClick={handleCreateOrJoin}
        className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
      >
        Create / Join Room
      </button>
    </div>
  );
};

export default Home;
