# 📍 FoundYou – Localização em Tempo Real com Amigos

O **FoundYou** é um aplicativo web que permite visualizar sua localização e a de outros usuários **em tempo real**. Criado para facilitar encontros, descobrir onde está a movimentação e acompanhar a posição dos seus amigos, o app exibe um mapa dinâmico com pins representando cada pessoa conectada.

Se você está procurando uma **resenha**, festa, evento espontâneo, ou simplesmente quer saber onde seus amigos estão — o FoundYou te ajuda a seguir o fluxo. 🔥

---

## 🚀 Funcionalidades

### 🗺️ Mapa em Tempo Real
- Exibe sua posição atual usando Geolocation API.
- Mostra outros usuários próximos com pins coloridos:
  - 🔵 Você
  - 🟢 Amigos
  - 🔴 Outros usuários
- Atualização automática da posição em tempo real.

### 👥 Sistema de Amizades
- Enviar solicitações de amizade
- Aceitar solicitações recebidas
- Ver lista de amigos
- Pins de amigos aparecem em destaque no mapa

### 🔄 Atualização via WebSocket
- Socket.io integrado para:
  - Atualização contínua de localização
  - Notificações de novas solicitações
  - Confirmações de amizade
  - Entrada/saída de usuários

### 🔐 Autenticação
- Login e cadastro de usuário
- Estado de login persistente com `localStorage`
- Validação de erros e feedback ao usuário

### ⚠️ Tratamento da Geolocalização
Se o usuário negar acesso à localização, o sistema exibe o aviso:

> ⚠️ Por favor, permita o acesso à sua localização para usar o mapa.

Sem travamentos e sem erros no console.

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- React.js  
- React-Leaflet + Leaflet  
- Material UI  
- Socket.io-client  
- Axios  
- Deploy: **Vercel**

### **Backend**
- Node.js  
- Express  
- Socket.io  
- MongoDB Atlas (mongoose)  
- Deploy: **Render**

---

## 📡 Como Funciona

1. Usuário acessa o app e faz login/cadastro  
2. Permite o acesso à geolocalização  
3. Sua posição é enviada ao backend continuamente  
4. O backend transmite para todos os usuários conectados  
5. O mapa renderiza os pins de cada pessoa  
6. Amigos são exibidos com ícone verde  

---

## ⚙️ Como Rodar o Projeto Localmente

### 1️⃣ Clone o repositório
```bash
git clone https://github.com/seu-usuario/FoundYou.git
cd FoundYou

### 2️⃣ Instale as dependências do frontend
npm install

### 3️⃣ Configure o backend
Crie um arquivo .env dentro da pasta server/:

MONGODB_URI=sua-string-de-conexao
PORT=3001

### 4️⃣ Instale o backend
cd server
npm install

5️⃣ Execute o backend
npm start

6️⃣ Execute o frontend
npm start

---

### 🌐 Deploys

Frontend: https://found-you.vercel.app

Backend: https://foundyou.onrender.com

Banco de dados: MongoDB Atlas

### 🎯 Objetivo do Projeto

O FoundYou foi pensado para ser uma ferramenta social moderna que ajuda pessoas a se encontrarem no mundo real.

Ele permite:

📍 Saber onde seus amigos estão

🎉 Ver onde as pessoas estão reunidas no momento

🔎 Encontrar lugares com movimento

🤝 Descobrir quem está perto de você

🗺️ Facilitar encontros rápidos

É perfeito para contextos como vida universitária, festas, resenhas e eventos informais.

---

🤝 Contribuições

Contribuições são bem-vindas!
Sinta-se livre para abrir issues e pull requests.
