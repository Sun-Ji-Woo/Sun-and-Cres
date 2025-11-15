const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.on('join', (data) => {
    const room = data.room || null;
    socket.data.user = data.user || 'anon';
    if (room) { socket.join(room); console.log(`${socket.data.user} joined room ${room}`); socket.to(room).emit('user-joined', { user: socket.data.user }); }
  });
  socket.on('message', (msg) => { if (msg.room) socket.to(msg.room).emit('message', msg); else socket.broadcast.emit('message', msg); });
  socket.on('typing', (t) => { if (t.room) socket.to(t.room).emit('typing', t); else socket.broadcast.emit('typing', t); });
  socket.on('disconnect', () => console.log('client disconnected', socket.id));
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('listening on', PORT));
