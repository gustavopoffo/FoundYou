const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ["http://localhost:3000", "https://found-you.vercel.app"],
  methods: ["GET", "POST", "PUT"],
  credentials: true
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://found-you.vercel.app"],
    methods: ["GET", "POST", "PUT"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

const userRoutes = require('./routes/user')(io);
app.use('/api/users', userRoutes);

// Mapeamento de usuários → socket.id
const users = {};

io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  socket.on('user_login', (username) => {
    socket.username = username;
    users[username] = socket.id;
    console.log(`Usuário ${username} mapeado para o socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.id}`);
    if (socket.username) {
      delete users[socket.username];
      console.log(`Usuário ${socket.username} removido do mapeamento.`);
    }
  });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado ao MongoDB Atlas!');
    server.listen(process.env.PORT || 3001, () => {
      console.log('Servidor rodando na porta', process.env.PORT || 3001);
    });
  })
  .catch(err => {
    console.error('Erro de conexão ao MongoDB:', err);
  });
