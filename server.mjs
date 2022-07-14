import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server);
app.use((req, res, next) => (req.io = io && next()));
io.on('connection', socket => {
  socket.on('offer', o => socket.broadcast.emit('offer', o));
  socket.on('answer', answer => socket.broadcast.emit('answer', answer));
});
app.use((req, res, next) => (req.io = io && next()));

app.use((_, res) => res.json({ true: true }));

server.listen(8000);
