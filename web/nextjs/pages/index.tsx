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
    s.on('new_message', (m: any) => setMessages(prev => [...prev, m]));
    return () => s.close();
  }, []);

  const send = () => {
    socket.emit('send_message', { conversationId: 'conv1', text });
    setText('');
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Meetup Chat — Demo</h1>
      <div style={{ height: 300, overflow: 'auto', border: '1px solid #ccc', padding: 8 }}>
        {messages.map((m, i) => <div key={i}>{m.text || JSON.stringify(m)}</div>)}
      </div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}
