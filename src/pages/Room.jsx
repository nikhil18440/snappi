import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, ref, get, set, onValue, auth, signInAnonymously } from '../firebase';
import ClipboardArea from '../components/ClipboardArea';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Room = () => {
  const { roomId } = useParams();
  const [userId, setUserId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [approved, setApproved] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [clipboardData, setClipboardData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;

    signInAnonymously(auth)
      .then((res) => {
        const uid = res.user.uid;
        setUserId(uid);
        handleJoinRoom(uid);
      })
      .catch((err) => {
        console.error("Auth error:", err);
      });
  }, [roomId]);

  const leaveRoom = async () => {
    if (!userId || !roomId) return;

    try {
      await set(ref(db, `rooms/${roomId}/participants/${userId}`), null);
      await set(ref(db, `rooms/${roomId}/requests/${userId}`), null);
      navigate('/');
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  const deleteRoom = async () => {
    if (!isOwner || !roomId) return;

    const confirm = window.confirm("Are you sure you want to delete this room?");
    if (!confirm) return;

    try {
      await set(ref(db, `rooms/${roomId}`), null);
      toast.success("Room deleted successfully 🚀");
      navigate('/');
    } catch (err) {
      console.error("Error deleting room:", err);
      toast.error("Failed to delete room.");
    }
  };

  const handleJoinRoom = async (uid) => {
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      const roomSnap = await get(roomRef);

      if (!roomSnap.exists()) {
        await set(roomRef, {
          owner: uid,
          participants: { [uid]: true },
          createdAt: Date.now()
        });

        setIsOwner(true);
        setApproved(true);

        const requestsRef = ref(db, `rooms/${roomId}/requests`);
        onValue(requestsRef, (snap) => {
          const data = snap.val();
          setPendingRequests(data ? Object.keys(data) : []);
        });

        onValue(roomRef, (snap) => {
          if (!snap.exists()) {
            toast.info("Room was deleted by the owner.");
            navigate('/');
          }
        });

        return;
      }

      const roomData = roomSnap.val();

      if (roomData.owner === uid) {
        setIsOwner(true);
        setApproved(true);

        const requestsRef = ref(db, `rooms/${roomId}/requests`);
        onValue(requestsRef, (snap) => {
          const data = snap.val();
          setPendingRequests(data ? Object.keys(data) : []);
        });
      } else if (roomData.participants && roomData.participants[uid]) {
        setApproved(true);
      } else {
        await set(ref(db, `rooms/${roomId}/requests/${uid}`), true);
        setApproved(false);
      }

      const participantRef = ref(db, `rooms/${roomId}/participants/${uid}`);
      onValue(participantRef, (snap) => {
        if (snap.exists()) {
          setApproved(true);
        }
      });

      onValue(roomRef, (snap) => {
        if (!snap.exists()) {
          toast.info("Room was deleted by the owner.");
          navigate('/');
        }
      });
    } catch (err) {
      console.error("Firebase error in handleJoinRoom:", err);
    }
  };

  const approveUser = async (uid) => {
    await set(ref(db, `rooms/${roomId}/participants/${uid}`), true);
    await set(ref(db, `rooms/${roomId}/requests/${uid}`), null);
  };

  const handleClipboardChange = (data) => {
    set(ref(db, `rooms/${roomId}/clipboard`), data);
  };

  useEffect(() => {
    if (approved) {
      const clipboardRef = ref(db, `rooms/${roomId}/clipboard`);
      const unsubscribe = onValue(clipboardRef, (snapshot) => {
        if (snapshot.exists()) {
          setClipboardData(snapshot.val());
        }
      });
      return () => unsubscribe();
    }
  }, [approved, roomId]);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center">
      <h1 className="text-4xl font-bold text-blue-800 mb-2">Snappi Room</h1>
      <p className="text-sm text-gray-600 mb-4">Room ID: <span className="font-mono text-black">{roomId}</span></p>
      <p className="text-base text-gray-700 mb-6">
        You are <span className="font-semibold text-blue-700">{isOwner ? 'the owner' : approved ? 'a participant' : 'waiting for approval'}</span>
      </p>

      {isOwner && pendingRequests.length > 0 && (
        <div className="mb-6 w-full max-w-xl">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">Pending Requests</h2>
          {pendingRequests.map((uid) => (
            <div key={uid} className="flex items-center justify-between mt-2 border p-3 rounded-lg bg-white shadow">
              <span className="text-sm font-mono text-gray-700">{uid}</span>
              <button
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-1 rounded-lg shadow"
                onClick={() => approveUser(uid)}
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      )}

      {approved ? (
        <>
          <ClipboardArea onClipboardChange={handleClipboardChange} />

          {clipboardData && (
            <div className="mt-8 w-full max-w-xl">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Live Clipboard</h2>
              <div className="border p-4 rounded-xl bg-white shadow">
                {clipboardData.type === 'text' && (
                  <p className="whitespace-pre-wrap text-gray-800">{clipboardData.content}</p>
                )}
                {clipboardData.type === 'image' && (
                  <img src={clipboardData.content} alt="Shared" className="max-w-full rounded" />
                )}
                {clipboardData.type === 'video' && (
                  <video controls className="w-full rounded">
                    <source src={clipboardData.content} />
                  </video>
                )}
                {clipboardData.type === 'doc' && (
                  <a href={clipboardData.content} download className="text-blue-600 underline">Download File</a>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-yellow-600 mt-10 text-sm italic">⏳ Waiting for approval from room owner...</p>
      )}

      <div className="mt-10 flex gap-4">
        <button
          onClick={leaveRoom}
          className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 border border-gray-300 shadow-sm"
        >
          Leave Room
        </button>

        {isOwner && (
          <button
            onClick={deleteRoom}
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 shadow"
          >
            Delete Room
          </button>
        )}
      </div>
    </div>
  );
};

export default Room;
