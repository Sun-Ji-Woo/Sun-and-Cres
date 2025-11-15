import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const uid = (n = 6) => Math.random().toString(36).slice(2, 2 + n);
const now = () => new Date().toLocaleTimeString();
const encodeStealth = (text) => { try { return btoa(unescape(encodeURIComponent(text))); } catch { return text; } };
const decodeStealth = (code) => { try { return decodeURIComponent(escape(atob(code))); } catch { return code; } };

export default function TwoPersonChat({ localUser = "Alex", otherUser = "Rin", serverUrl = "http://localhost:4000" }) {
  // read room from URL or create one
  const urlParams = new URLSearchParams(window.location.search);
  const initialRoom = urlParams.get('room') || uid(6);
  const [room, setRoom] = useState(initialRoom);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [simulateRemote, setSimulateRemote] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

  useEffect(() => {
    let socket;
    try { socket = io(serverUrl, { transports: ["websocket"] }); } catch (err) { socket = null; }
    if (!socket) { setConnected(false); setSimulateRemote(true); return; }
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { user: localUser, room });
    });
    socket.on("message", (data) => {
      const text = data.stealth ? decodeStealth(data.payload) : data.payload;
      receiveRemoteMessage({ id: data.id || uid(), from: data.from, to: data.to, text, time: data.time || now(), status: "delivered" });
    });
    socket.on("typing", (data) => { setOtherTyping(data.user !== localUser && data.typing); });
    socket.on("user-joined", (d) => { /* could show presence */ });
    socket.on("disconnect", () => setConnected(false));
    return () => { socket && socket.disconnect(); };
  }, [serverUrl, localUser, room]);

  const subsRef = useRef([]);
  const subscribeLocalOutgoing = (fn) => { subsRef.current.push(fn); return () => { subsRef.current = subsRef.current.filter(s => s !== fn); }; };
  const publishOutgoing = (msg) => { subsRef.current.forEach(fn => fn(msg)); };

  useEffect(() => {
    if (!simulateRemote) return;
    const handler = (msg) => {
      if (msg.to !== otherUser) return;
      setTimeout(() => setOtherTyping(true), 400);
      setTimeout(() => {
        setOtherTyping(false);
        const replyText = simpleReplyTo(msg.text);
        receiveRemoteMessage({ id: uid(), from: otherUser, to: localUser, text: replyText, time: now(), status: "delivered" });
      }, 1200 + Math.random() * 1000);
    };
    const unsub = subscribeLocalOutgoing(handler);
    return unsub;
  }, [simulateRemote, otherUser, localUser]);

  const simpleReplyTo = (text) => {
    if (!text) return "hey!";
    const t = text.toLowerCase();
    if (t.includes("hello") || t.includes("hi")) return "hey! what's up?";
    if (t.includes("playlist") || t.includes("blend")) return "lol nice playlist name 😂";
    if (t.length < 5) return "hmm";
    return "nice — tell me more.";
  };

  function receiveRemoteMessage(msg) { setMessages(prev => [...prev, { ...msg, status: msg.status || "delivered" }]); }

  function sendMessageRaw(text) {
    if (!text.trim()) return;
    const message = { id: uid(8), from: localUser, to: otherUser, text, time: now(), status: "sent" };
    setMessages(prev => [...prev, message]);
    const outgoing = { id: message.id, from: message.from, to: message.to, time: message.time, room, stealth: stealthMode, payload: stealthMode ? encodeStealth(text) : text };
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("message", outgoing);
      setTimeout(() => updateMessageStatus(message.id, "delivered"), 400);
      setTimeout(() => updateMessageStatus(message.id, "read"), 1600);
    } else if (simulateRemote) {
      publishOutgoing({ ...message });
      setTimeout(() => updateMessageStatus(message.id, "delivered"), 300);
      setTimeout(() => updateMessageStatus(message.id, "read"), 1000 + Math.random() * 1200);
    } else {
      setTimeout(() => updateMessageStatus(message.id, "failed"), 800);
    }
  }

  function updateMessageStatus(id, status) { setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m)); }
  function handleSend() { if (!input.trim()) return; sendMessageRaw(input.trim()); setInput(""); }
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } else {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("typing", { user: localUser, typing: true, room });
        clearTimeout((handleKey).once);
        (handleKey).once = setTimeout(() => { socketRef.current && socketRef.current.emit("typing", { user: localUser, typing: false, room }); }, 900);
      }
    }
  }
  function sendHello() { setInput(prev => prev ? prev + " hello" : "Hello"); }
  function toggleStealth() { setStealthMode(s => !s); }

  // Share link function
  function copyShareLink() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room}`;
    navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard! Paste it to your friend.'));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-12">
        <aside className="col-span-3 border-r p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chats</h2>
            <div className="text-sm text-gray-500">{connected ? "Online" : "Offline"}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">{localUser[0]}</div>
            <div><div className="font-semibold">{localUser}</div><div className="text-xs text-gray-500">You</div></div>
          </div>
          <div className="mt-2">
            <div className="p-3 rounded-lg bg-gray-50 border"><div className="font-medium">{otherUser}</div><div className="text-xs text-gray-500">{otherTyping ? `typing...` : `room: ${room}`}</div></div>
          </div>
          <div className="mt-auto">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={simulateRemote} onChange={(e) => setSimulateRemote(e.target.checked)} className="rounded" />
              <span>Simulate remote (no server)</span>
            </label>
            <label className="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" checked={stealthMode} onChange={toggleStealth} className="rounded" />
              <span>Stealth mode (encode into playlist names)</span>
            </label>
            <div className="text-xs text-gray-500 mt-3">Tip: Stealth mode encodes your message into a base64 string which you could paste as a playlist name on other platforms to "hide" the message text. Use decode to read.</div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setRoom(uid(6)); }} className="px-3 py-2 rounded border">New room</button>
              <button onClick={copyShareLink} className="px-3 py-2 rounded bg-indigo-600 text-white">Share link</button>
            </div>
          </div>
        </aside>
        <main className="col-span-9 flex flex-col">
          <header className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-300 flex items-center justify-center font-semibold">{otherUser[0]}</div>
              <div><div className="font-semibold">{otherUser}</div><div className="text-xs text-gray-500">Friends</div></div>
            </div>
            <div className="text-sm">{connected ? `Connected to ${serverUrl}` : `Not connected to server`}</div>
          </header>
          <section className="flex-1 overflow-hidden p-4 flex flex-col">
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-3">
              {messages.length === 0 ? (<div className="text-center text-gray-400 mt-8">No messages yet. Say hi 👋</div>) : (messages.map(msg => (<div key={msg.id} className={`max-w-[70%] p-3 rounded-2xl ${msg.from === localUser ? 'ml-auto bg-indigo-50 text-right' : 'mr-auto bg-gray-50 text-left'}`}><div className="text-sm break-words">{msg.text}</div><div className="text-xs text-gray-400 mt-1">{msg.time} · {msg.from === localUser ? msg.status : ''}</div></div>)))}
              {otherTyping && (<div className="max-w-[40%] p-2 rounded-xl bg-gray-100">{otherUser} is typing...</div>)}
            </div>
            <div className="mt-3">
              <div className="flex gap-2 items-center">
                <button onClick={() => { setInput(prev => prev + \" 🎧 Playlist\") }} className="px-3 py-2 rounded-lg border">🎧</button>
                <button onClick={() => { sendHello(); }} className="px-3 py-2 rounded-lg border">Hello</button>
                <div className="flex-1">
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={stealthMode ? "Type a secret message (will be encoded)..." : "Type a message..."} className="w-full p-3 rounded-lg border resize-none h-16" />
                </div>
                <button onClick={handleSend} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Send</button>
              </div>
              <div className="text-xs text-gray-500 mt-2">Press Enter to send. Shift+Enter for newline.</div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
