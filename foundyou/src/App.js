import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import './App.css';
import { TextField, Button, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";


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


// Envia localização ao backend
const sendLocationToServer = (username, lat, lng) => {
  axios.put('https://foundyou.onrender.com/api/users/update-location', { username, lat, lng })
    .then(response => console.log("Localização enviada:", response.data))
    .catch(error => console.error("Erro ao enviar localização:", error));
};


function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationAllowed, setLocationAllowed] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [friendsUsernames, setFriendsUsernames] = useState([]);
  const [registerError, setRegisterError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(true);
  const [friendSearchUsername, setFriendSearchUsername] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  const [socket, setSocket] = useState(null);

  // ============================
  // REGISTRO
  // ============================
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://foundyou.onrender.com/api/users/register', { username, password });
      alert('Cadastro concluído! Agora faça o login.');
      setIsLoggingIn(true);
    } catch (error) {
      setRegisterError(error.response.data.message || 'Erro ao cadastrar usuário.');
    }
  };

  // ============================
  // LOGIN
  // ============================
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://foundyou.onrender.com/api/users/login', { username, password });
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
    } catch (error) {
      setRegisterError(error.response.data.message || 'Erro ao fazer login.');
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    if (socket) socket.disconnect();
  };

  // ============================
  // RECUPERA LOGIN AUTOMÁTICO
  // ============================
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  // ============================
  // FETCH FRIENDS & REQUESTS
  // ============================
  const fetchFriendRequests = useCallback(async () => {
    try {
      const res = await axios.get(`https://foundyou.onrender.com/api/users/friend-requests/${username}`);
      setFriendRequests(res.data);
    } catch (err) {
      console.error("Erro ao carregar solicitações:", err);
    }
  }, [username]);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await axios.get(`https://foundyou.onrender.com/api/users/friends/${username}`);
      setFriendsUsernames(res.data.map(f => f.username));
    } catch (err) {
      console.error("Erro ao carregar amigos:", err);
    }
  }, [username]);

  // ============================
  // SOCKET.IO + GEOLOCALIZAÇÃO
  // ============================
  useEffect(() => {
    if (!isLoggedIn) return;

    // ---- 1. Conecta ao socket ----
    const newSocket = io('https://foundyou.onrender.com', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('user_login', username);
    });

    // ---- 2. Geolocalização amigável ----
    const watchId = navigator.geolocation.watchPosition(
      (loc) => {
        const userLat = loc.coords.latitude;
        const userLng = loc.coords.longitude;

        setPosition([userLat, userLng]);
        setLocationAllowed(true);
        setLoadingLocation(false);

        sendLocationToServer(username, userLat, userLng);
      },
      (error) => {
        setLoadingLocation(false);

        if (error.code === 1) {
          // PERMISSION_DENIED
          setLocationAllowed(false);
        }
      },
      { enableHighAccuracy: true }
    );

    // ---- 3. Carrega informações do backend ----
    fetchFriends();
    fetchFriendRequests();

    axios.get('https://foundyou.onrender.com/api/users/all')
      .then(res => setAllUsers(res.data))
      .catch(err => console.error("Erro ao carregar usuários:", err));

    newSocket.on('location_update', (data) => {
      setAllUsers(prev => {
        const updated = prev.map(u =>
          u.username === data.username ? { ...u, location: data.location } : u
        );
        if (!updated.find(u => u.username === data.username)) {
          updated.push(data);
        }
        return updated;
      });
    });

    newSocket.on('new_friend_request', fetchFriendRequests);
    newSocket.on('friend_request_accepted', fetchFriends);

    return () => {
      if (newSocket) newSocket.disconnect();
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isLoggedIn, username, fetchFriends, fetchFriendRequests]);

  // ============================
  // TELA DE LOGIN
  // ============================
  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="navbar">
          <p className='Titulo'>FOUND<span>YOU</span></p>
          <p className='subtitulo'> Siga o fluxo</p>
        </div>

        <p className='espaco'>{isLoggingIn ? 'Faça seu login!' : 'Crie sua conta agora!'}</p>

        <form onSubmit={isLoggingIn ? handleLogin : handleRegister} className="login-form">
          <TextField label="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} required sx={{ width: 300 }} />
          <br></br>
          <TextField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ width: 300 }} />
          <br></br>
          <Button type="submit" variant="contained" sx={{ width: 300 }}>
            {isLoggingIn ? 'Login' : 'Cadastrar'}
          </Button>
          {registerError && <Typography color="error">{registerError}</Typography>}
        </form>

        <Button onClick={() => setIsLoggingIn(!isLoggingIn)} sx={{ mt: 2 }}>
          {isLoggingIn ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
        </Button>
      </div>
    );
  }

  // ============================
  // SE PERMISSÃO NEGADA
  // ============================
  if (!locationAllowed) {
    return (
      <div className="App" style={{ padding: 20, textAlign: "center" }}>
        <h2>⚠️ Permita o acesso à sua localização</h2>
        <p>O FoundYou precisa da sua localização para mostrar seus amigos no mapa.</p>
      </div>
    );
  }

  // ============================
  // CARREGANDO LOCALIZAÇÃO
  // ============================
  if (loadingLocation || !position) {
    return <h1 style={{ textAlign: "center", marginTop: 40 }}>Carregando sua localização...</h1>;
  }

  // ============================
  // MAPA
  // ============================
  return (
    <div className="map-container">
      {/* SIDEBAR */}
        <button 
    className="sidebar-toggle"
    onClick={() => {
      document.querySelector(".sidebar").classList.toggle("sidebar-open");
      document.querySelector(".sidebar-content")?.classList.toggle("sidebar-open");
    }}
  >
    ☰
  </button>
      <div className="sidebar">
        <Button
          variant={showFriendSearch ? "contained" : "outlined"}
          fullWidth sx={{ mb: 1 }}
          onClick={() => { setShowRequests(false); setShowFriendSearch(true); }}
        >
          Buscar Amigos
        </Button>

        <Button
          variant={showRequests ? "contained" : "outlined"}
          fullWidth sx={{ mb: 1 }}
          onClick={() => { setShowFriendSearch(false); setShowRequests(true); }}
        >
          Solicitações ({friendRequests.length})
        </Button>

        <Button variant="outlined" color="error" fullWidth onClick={handleLogout} sx={{ mt: 2 }}>
          Sair
        </Button>
      </div>

      {/* SIDEBAR CONTENT */}
      {showFriendSearch && (
        <div className="sidebar-content">
          <Typography variant="h6">Buscar Amigos</Typography>
          <TextField
            fullWidth size="small" label="Nome de usuário"
            value={friendSearchUsername}
            onChange={(e) => setFriendSearchUsername(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button variant="contained" fullWidth onClick={async () => {
            try {
              const res = await axios.post('https://foundyou.onrender.com/api/users/send-friend-request', {
                myUsername: username,
                friendUsername: friendSearchUsername
              });
              alert(res.data.message);
              setFriendSearchUsername('');
            } catch (error) {
              alert(error.response.data.message);
            }
          }}>
            Enviar Solicitação
          </Button>
        </div>
      )}

      {showRequests && (
        <div className="sidebar-content">
          <Typography variant="h6">Solicitações Recebidas</Typography>
          {friendRequests.length > 0 ? (
            <ul style={{ padding: 0, listStyle: "none" }}>
              {friendRequests.map(req => (
                <li key={req._id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  <span>{req.username}</span>
                  <Button
                    variant="contained" size="small" color="success"
                    onClick={() => axios.post('https://foundyou.onrender.com/api/users/accept-friend-request', {
                      myUsername: username,
                      requesterUsername: req.username
                    }).then(fetchFriends).then(fetchFriendRequests)}
                  >
                    Aceitar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">Nenhuma solicitação.</Typography>
          )}
        </div>
      )}

      {/* MAPA */}
      <MapContainer center={position} zoom={13} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {allUsers.map((user) =>
          user.location?.lat ? (
            <Marker
              key={user._id}
              position={[user.location.lat, user.location.lng]}
              icon={
                user.username === username
                  ? userIcon
                  : friendsUsernames.includes(user.username)
                  ? friendIcon
                  : otherUserIcon
              }
            >
              <Popup>
                {user.username}
                {user.username === username && " (Você)"}
                {friendsUsernames.includes(user.username) && " (Amigo)"}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
}

export default App;
