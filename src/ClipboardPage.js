import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from './firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

function ClipboardPage() {
  const { sessionId } = useParams();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Connecting...');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const authenticateAndInitialize = async () => {
      try {
        // 1. Sign in anonymously
        const result = await signInAnonymously(auth);
        const user = result.user;

        // 2. Get session reference
        const sessionRef = ref(db, `snappi_clipboard/${sessionId}`);
        const snapshot = await get(sessionRef);

        if (!snapshot.exists()) {
          // First-time session: create and set owner
          await set(sessionRef, {
            owner: user.uid,
            text: ''
          });
          setStatus('Session created. You are the owner.');
        } else {
          const data = snapshot.val();

          // If no owner, claim session
          if (!data.owner) {
            await set(sessionRef, {
              ...data,
              owner: user.uid
            });
            setStatus('You claimed this session.');
          } else if (data.owner !== user.uid) {
            setAccessDenied(true);
            setStatus('Access Denied ❌ You are not the owner of this session.');
            return;
          } else {
            setStatus('Synced ✨');
          }

          setText(data.text || '');
        }

        // 3. Set up real-time listener
        onValue(sessionRef, (snapshot) => {
          const data = snapshot.val();
          if (data && data.owner === auth.currentUser.uid) {
            setText(data.text || '');
            setStatus('Synced ✨');
          }
        });
      } catch (err) {
        console.error('🔥 Error:', err);
        setStatus('Permission Denied ❌');
      }
    };

    authenticateAndInitialize();
  }, [sessionId]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setStatus('Updating ⏳');

    const sessionTextRef = ref(db, `snappi_clipboard/${sessionId}/text`);
    set(sessionTextRef, newText);
  };

  if (accessDenied) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Session: {sessionId}</h2>
        <p style={{ color: 'red' }}>{status}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Session: {sessionId}</h2>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Type or paste something..."
        style={{ width: '100%', height: '200px', fontSize: '16px' }}
      />
      <p>Status: <span>{status}</span></p>
    </div>
  );
}

export default ClipboardPage;
