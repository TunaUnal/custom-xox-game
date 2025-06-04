import React, { useState , useEffect} from 'react';
import LoginPage from './pages/LoginPage';
import { io } from 'socket.io-client';
import GamePage from './pages/GamePage';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
const socket = io('https://custom-xox-game.onrender.com:3000');

function App() {
  const [status, setStatus] = useState('login') // login - game
  const [user, setUser]     = useState('');
  const [room, setRoom]     = useState('');
  
  useEffect(() => {
    socket.on('err', error => {
      toast.error(error);
    })

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

    socket.on('roomLeaved', () => {
      toast.success('Odadan ayrıldın.')
      setRoom(null);
      setStatus('login');
    })

    socket.on('roomKicked', () => {
      toast.error('Odadan atıldın.')
      setRoom(null);
      setStatus('login');
    })

    socket.on('userKicked', (getRoom, kickedUserName) => {
      setRoom(getRoom)
      toast.success(kickedUserName + " adlı oyuncuyu odadan attın")
    })

    socket.on('someoneJoined', (getNewUser, getRoom) => {
      toast.success(getNewUser + " odaya katıldı")
      setRoom(getRoom);
    })

    socket.on('someoneLeaved', (getRoom, getLeavedUser,youAreNowOwner) => {
      if(youAreNowOwner){
        toast.success(getLeavedUser + " odadan ayrıldı. Artık oda sahibi sensin.")
      }else{
        toast.success(getLeavedUser + " odadan ayrıldı.")
      }

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

  if (status == "login") return (<> <Toaster></Toaster> <LoginPage onCreateRoom={createRoom} onJoinRoom={joinRoom} /> </>);
  return (<><Toaster></Toaster><GamePage user={user} room={room} socket={socket} setUser={setUser} setRoom={setRoom}/></>)
}

export default App;
