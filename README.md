# FoundYou — Localização de usuários em tempo real

FoundYou é uma aplicação web que permite visualizar sua própria localização e a de outros usuários conectados em tempo real. Além disso, o sistema possibilita adicionar amigos, visualizar onde eles estão e observar regiões com maior concentração de usuários. A proposta é auxiliar pessoas que procuram eventos, encontros ou movimentações próximas.

A aplicação utiliza:

- React e Leaflet para exibição do mapa e dos marcadores  
- Node.js, Express e Socket.IO para comunicação em tempo real  
- MongoDB Atlas para armazenamento de usuários e suas localizações  
- Render (backend) e Vercel (frontend) para hospedagem

---

## Acesse o aplicativo

Versão pública hospedada na Vercel:  
**https://found-you.vercel.app**

---

## Funcionalidades

- Exibição da sua localização atual no mapa  
- Marcadores diferenciados para amigos e usuários gerais  
- Atualização de localização em tempo real via Socket.IO  
- Envio e aceite de solicitações de amizade  
- Login e cadastro com autenticação básica  
- Persistência de sessão via localStorage  
- Interface responsiva


---

## Tecnologias utilizadas

- React
- Leaflet
- Express
- Socket.IO
- Axios
- MongoDB Atlas
- Render
- Vercel

---

## Como executar localmente

```bash
git clone https://github.com/seu-usuario/FoundYou.git
cd FoundYou

### Instale as dependências do frontend
npm install

### Configure o backend
Crie um arquivo .env dentro da pasta server/:

MONGODB_URI=sua-string-de-conexao
PORT=3001

### Instale o backend
cd server
npm install

### Execute o backend
node index.js

### Execute o frontend
npm start


