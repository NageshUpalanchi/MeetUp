import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function Home() {
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8081', { query: { userId: 'u1' } });
    setSocket(s);
    s.emit('join_conv', 'conv1');
    return () => {
      s.disconnect();
    };
  }, []);

  const send = async () => {
    if (text.trim()) {
      setMessages(prev => [...prev, { text }]); // Show user message
      const reply = await askChatGPT(text);     // Get ChatGPT response
      setMessages(prev => [...prev, { text: reply }]); // Show ChatGPT reply
      setText('');
    }
  };

  // Example function to call ChatGPT from frontend (for testing only)
  async function askChatGPT(message: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(44, 62, 80, 0.15)',
          padding: 32,
          width: 400,
          maxWidth: '90vw',
        }}
      >
        <h1 style={{ textAlign: 'center', color: '#2575fc', marginBottom: 24 }}>
          Meetup Chat
        </h1>
        <div
          style={{
            height: 260,
            overflow: 'auto',
            borderRadius: 8,
            border: '1px solid #e0e0e0',
            background: '#f7f9fa',
            padding: 12,
            marginBottom: 16,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center', marginTop: 80 }}>
              No messages yet 1.
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                style={{
                  background: '#e3f0ff',
                  color: '#2575fc',
                  padding: '8px 12px',
                  borderRadius: 6,
                  marginBottom: 8,
                  wordBreak: 'break-word',
                  fontSize: 15,
                }}
              >
                {m.text || JSON.stringify(m)}
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid #d0d0d0',
              fontSize: 15,
              outline: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') send();
            }}
          />
          <button
            onClick={send}
            style={{
              background: 'linear-gradient(90deg, #2575fc 0%, #6a11cb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(44, 62, 80, 0.08)',
              transition: 'background 0.2s',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
