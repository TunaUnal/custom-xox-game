import React, { useState , useEffect} from 'react';
import LoginPage from './pages/LoginPage';
import { io } from 'socket.io-client';
import GamePage from './pages/GamePage';

const socket = io('http://localhost:3000');

function App() {
  const [status, setStatus] = useState('login') // login - game
  const [user, setUser]     = useState('');
  const [room, setRoom]     = useState('');
  
  useEffect(() => {
    socket.on('roomCreated', (getUser, getRoom) => {
      setUser(getUser);
      setRoom(getRoom);
      setStatus('game');
    });
    
    socket.on('roomJoined', (getUser,getRoom) => {
      setUser(getUser) 
      setRoom(getRoom);
      setStatus('game');
    });

    socket.on('someoneJoined', getRoom => {
      setRoom(getRoom);
    })

    socket.on('someoneLeaved', getRoom => {
      setRoom(getRoom);
    })

    return () => {
      socket.off('message');
      socket.off('userLogin');
      socket.off('userLogout');
    };
  }, []);

  const createRoom = (user) => {
    socket.emit('createRoom', user);
  };
  
  
  const joinRoom = (user,roomCode) => {
    socket.emit('joinRoom', { user:user, roomCode:roomCode });

  };

  if (status == "login") return <LoginPage onCreateRoom={createRoom} onJoinRoom={joinRoom} />;
  return <GamePage user={user} room={room} socket={socket} setUser={setUser} setRoom={setRoom}/>
}

export default App;
