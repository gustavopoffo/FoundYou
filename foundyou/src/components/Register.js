import React, { useState } from 'react';

const Register = ({ onRegisterSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Limpa mensagens anteriores
    setIsError(false);

    if (username.length < 3) {
      setMessage('Nome de usuário deve ter no mínimo 3 caracteres.');
      setIsError(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsError(false);
        // Chama a função para navegar para o mapa após 2 segundos
        setTimeout(() => onRegisterSuccess(username), 2000); 
      } else {
        setMessage(data.message || 'Erro ao cadastrar. Tente novamente.');
        setIsError(true);
      }
    } catch (error) {
      setMessage('Erro de conexão com o servidor.');
      setIsError(true);
    }
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Não quer ficar de fora dos seus amigos, né?</h1>
      <h2>Crie sua conta agora!</h2>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: '10px', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '10px', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button 
          type="submit" 
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cadastrar
        </button>
      </form>
      {message && (
        <p style={{ color: isError ? 'red' : 'green', marginTop: '15px' }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Register;