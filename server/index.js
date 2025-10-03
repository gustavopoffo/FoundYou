const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT"]
  }
});

const userRoutes = require('./routes/user')(io);

app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

// NOVO: Objeto para mapear usuários a IDs de socket
const users = {};

io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  // NOVO: Ouvir o evento de login para mapear o usuário
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

mongoose.connect('mongodb+srv://gustavopoffo:Mfvg1343@foundyou.7eorldt.mongodb.net/?retryWrites=true&w=majority&appName=FoundYou')
  .then(() => {
    console.log('Conectado ao MongoDB Atlas!');
    server.listen(3001, () => {
      console.log('Servidor rodando na porta 3001');
    });
  })
  .catch(err => {
    console.error('Erro de conexão ao MongoDB:', err);
  });