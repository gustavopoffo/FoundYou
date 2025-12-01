const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); // NOVO: Importar bcryptjs

module.exports = (io) => {

   router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: 'Nome de usuário já existe.' });
      }

      // NOVO: Gerar um hash da senha antes de salvar
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({ username, password: hashedPassword }); // Salva a senha criptografada
      await newUser.save();
      res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao cadastrar usuário.', error: err.message });
    }
  });

   router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      // NOVO: Comparar a senha digitada com a senha criptografada
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Senha incorreta.' });
      }
      res.status(200).json({ message: 'Login bem-sucedido!', username: user.username });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao fazer login.', error: err.message });
    }
  });

  router.get('/all', async (req, res) => {
    try {
      const users = await User.find({}, 'username location');
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar usuários.', error: err.message });
    }
  });

  router.get('/friends/:username', async (req, res) => {
    const { username } = req.params;
    try {
      const user = await User.findOne({ username }).populate('friends');
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      const friendsLocations = user.friends.map(friend => ({
        username: friend.username,
        location: friend.location
      }));
      res.status(200).json(friendsLocations);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar amigos.', error: err.message });
    }
  });

  router.post('/send-friend-request', async (req, res) => {
    const { myUsername, friendUsername } = req.body;
    try {
      const me = await User.findOne({ username: myUsername });
      const friend = await User.findOne({ username: friendUsername });

      if (!me || !friend) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      if (friend.friendRequests.includes(me._id)) {
        return res.status(400).json({ message: 'Solicitação já enviada.' });
      }
      if (me.friends.includes(friend._id)) {
          return res.status(400).json({ message: 'Vocês já são amigos.' });
      }

      friend.friendRequests.push(me._id);
      await friend.save();

      // NOVO: Enviar uma notificação para o usuário que recebeu a solicitação
      io.to(friend.username).emit('new_friend_request', {
        requesterUsername: myUsername
      });

      res.status(200).json({ message: 'Solicitação de amizade enviada!' });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao enviar solicitação.', error: err.message });
    }
  });

  router.post('/accept-friend-request', async (req, res) => {
    const { myUsername, requesterUsername } = req.body;
  try {
    const me = await User.findOne({ username: myUsername });
    const requester = await User.findOne({ username: requesterUsername });

    if (!me || !requester) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (!me.friends.includes(requester._id)) me.friends.push(requester._id);
    if (!requester.friends.includes(me._id)) requester.friends.push(me._id);

    me.friendRequests = me.friendRequests.filter(
      reqId => reqId.toString() !== requester._id.toString()
    );

    await me.save();
    await requester.save();

    res.status(200).json({ message: 'Amizade aceita com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao aceitar solicitação.', error: err.message });
  }
  });

  router.get('/friend-requests/:username', async (req, res) => {
    const { username } = req.params;
    try {
      const user = await User.findOne({ username }).populate('friendRequests');
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      const requests = user.friendRequests.map(requester => ({
        username: requester.username,
        _id: requester._id,
      }));
      res.status(200).json(requests);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar solicitações.', error: err.message });
    }
  });
  
  router.put('/update-location', async (req, res) => {
    const { username, lat, lng } = req.body;
    try {
      const user = await User.findOneAndUpdate(
        { username: username },
        {
          $set: {
            'location.lat': lat,
            'location.lng': lng,
            'location.lastUpdated': new Date()
          }
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      io.emit('location_update', {
        username: user.username,
        location: user.location,
      });

      res.status(200).json({ message: 'Localização atualizada com sucesso!', user });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao atualizar a localização.', error: err.message });
    }
  });

  return router;
};