import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import './App.css';
import { TextField, Button,Typography } from "@mui/material";


// Ícones
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  shadowSize: [41, 41],
});
const friendIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  shadowSize: [41, 41],
});
const otherUserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const sendLocationToServer = (username, lat, lng) => {
  axios.put('http://localhost:3001/api/users/update-location', { username, lat, lng })
    .then(response => {
      console.log("Localização enviada com sucesso:", response.data);
    })
    .catch(error => {
      console.error("Erro ao enviar a localização:", error);
    });
};

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState([0, 0]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [friendsUsernames, setFriendsUsernames] = useState([]);
  const [registerError, setRegisterError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(true);
  const [friendSearchUsername, setFriendSearchUsername] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  // NOVO: Adicionar estado para o socket
  const [socket, setSocket] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/users/register', { username, password });
      console.log(response.data);
      alert('Cadastro concluído! Agora faça o login.');
      setIsLoggingIn(true);
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error.response.data.message);
      setRegisterError(error.response.data.message || 'Erro ao cadastrar usuário.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/users/login', { username, password });
      console.log(response.data);
      setIsLoggedIn(true);
      setRegisterError('');
      // NOVO: Salvar o estado de login no localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
    } catch (error) {
      console.error("Erro ao fazer login:", error.response.data.message);
      setRegisterError(error.response.data.message || 'Erro ao fazer login.');
    }
  };

  // NOVO: Função de logout para remover o estado do localStorage
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    if(socket) {
      socket.disconnect();
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/users/send-friend-request', {
        myUsername: username,
        friendUsername: friendSearchUsername
      });
      alert(response.data.message);
      setFriendSearchUsername('');
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error.response.data.message);
      alert(error.response.data.message);
    }
  };

  const handleAcceptFriendRequest = async (requesterUsername) => {
    try {
      const response = await axios.post('http://localhost:3001/api/users/accept-friend-request', {
        myUsername: username,
        requesterUsername: requesterUsername,
      });
      alert(response.data.message);
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error("Erro ao aceitar solicitação:", error);
      alert('Erro ao aceitar solicitação.');
    }
  };

  const fetchFriendRequests = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/users/friend-requests/${username}`);
      setFriendRequests(response.data);
    } catch (error) {
      console.error("Erro ao buscar solicitações de amizade:", error);
    }
  }, [username]);

  const fetchFriends = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/users/friends/${username}`);
      const friendsList = response.data.map(friend => friend.username);
      setFriendsUsernames(friendsList);
    } catch (error) {
      console.error("Erro ao carregar a lista de amigos:", error);
    }
  }, [username]);

  useEffect(() => {
    // NOVO: Verificar o localStorage na montagem do componente
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []); // O array vazio garante que isso rode apenas uma vez

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // NOVO: Emitir o evento de login assim que a conexão for estabelecida
    newSocket.on('connect', () => {
      newSocket.emit('user_login', username);
      console.log('Emitindo evento de login para o servidor.');
    });

    const watchId = navigator.geolocation.watchPosition(
      (location) => {
        const userLat = location.coords.latitude;
        const userLng = location.coords.longitude;
        setPosition([userLat, userLng]);
        setLoading(false);
        if (username) {
          sendLocationToServer(username, userLat, userLng);
        }
      },
      (error) => {
        console.error("Erro ao obter a localização:", error);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    
    fetchFriends();
    fetchFriendRequests();

    axios.get('http://localhost:3001/api/users/all')
      .then(response => {
        setAllUsers(response.data);
      })
      .catch(error => console.error("Erro ao carregar a localização dos usuários:", error));
    
    newSocket.on('location_update', (data) => {
      setAllUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.username === data.username 
            ? { ...user, location: data.location }
            : user
        );
        if (!updatedUsers.find(u => u.username === data.username)) {
          updatedUsers.push({ username: data.username, location: data.location, _id: data.username });
        }
        return updatedUsers;
      });
    });

    // Ouvir por novas solicitações de amizade
    newSocket.on('new_friend_request', () => {
      console.log('Nova solicitação de amizade recebida! Atualizando lista...');
      fetchFriendRequests();
    });

    // Ouvir quando uma solicitação de amizade for aceita
    newSocket.on('friend_request_accepted', () => {
      console.log('Solicitação de amizade aceita! Atualizando lista de amigos...');
      fetchFriends();
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isLoggedIn, username, fetchFriends, fetchFriendRequests]);

  if (!isLoggedIn) {
    return (
      <div className="App">
      <div className='navbar'>
        <p className='Titulo'>FOUND<span>YOU</span></p>
        <p className='subtitulo'> Siga o fluxo</p>
      </div>
      <p className='espaco'>{isLoggingIn ? 'Faça seu login!' : 'Crie sua conta agora!'}</p>
      <form onSubmit={isLoggingIn ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <TextField
        id="username"
        label="Nome de usuário"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        sx={{ width: 300 }}
        />
        <TextField
        id="password"
        label="Senha"
        variant="outlined"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        sx={{ width: 300 }}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ width: 300 }}>
        {isLoggingIn ? 'Login' : 'Cadastrar'}
        </Button>
        {registerError && <Typography color="error">{registerError}</Typography>}
      </form>
      <Button onClick={() => setIsLoggingIn(!isLoggingIn)} sx={{ mt: 2 }}>
        {isLoggingIn ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça o login'}
      </Button>
      </div>
    );
  }

  if (loading) {
    return <h1>Carregando mapa...</h1>;
  }

  return (
    <div className="map-container">
      <div className="sidebar">
        <Button
          variant={showFriendSearch ? "contained" : "outlined"}
          color="primary"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => { setShowRequests(false); setShowFriendSearch(true); }}
        >
          Buscar Amigos
        </Button>

        <Button
          variant={showRequests ? "contained" : "outlined"}
          color="primary"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => { setShowFriendSearch(false); setShowRequests(true); }}
        >
          Solicitações ({friendRequests.length})
        </Button>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          className="logout-btn"
          sx={{ mt: 2 }}
          onClick={handleLogout}
        >
          Sair
        </Button>
      </div>

      {showFriendSearch && (
        <div className="sidebar-content">
          <Typography variant="h6" gutterBottom>Buscar Amigos</Typography>
          <TextField
            fullWidth
            size="small"
            label="Nome de usuário"
            variant="outlined"
            value={friendSearchUsername}
            onChange={(e) => setFriendSearchUsername(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSendFriendRequest}
          >
            Enviar Solicitação
          </Button>
        </div>
      )}

      {showRequests && (
        <div className="sidebar-content">
          <Typography variant="h6" gutterBottom>Solicitações Recebidas</Typography>
          {friendRequests.length > 0 ? (
            <ul style={{ paddingLeft: 0, listStyle: "none" }}>
              {friendRequests.map((request) => (
                <li key={request._id} style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{request.username}</span>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => handleAcceptFriendRequest(request.username)}
                  >
                    Aceitar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">Nenhuma solicitação de amizade.</Typography>
          )}
        </div>
      )}

      <MapContainer center={position} zoom={13} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {allUsers.map((user) => {
          if (user.location && user.location.lat && user.location.lng) {
            if (user.username === username) {
              return (
                <Marker key={user._id} position={[user.location.lat, user.location.lng]} icon={userIcon}>
                  <Popup>Você está aqui!</Popup>
                </Marker>
              );
            } else if (friendsUsernames.includes(user.username)) {
              return (
                <Marker key={user._id} position={[user.location.lat, user.location.lng]} icon={friendIcon}>
                  <Popup>{user.username} (Amigo)</Popup>
                </Marker>
              );
            } else {
              return (
                <Marker key={user._id} position={[user.location.lat, user.location.lng]} icon={otherUserIcon}>
                  <Popup>{user.username}</Popup>
                </Marker>
              );
            }
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}

export default App;