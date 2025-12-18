import React, {useState, useEffect, useRef} from 'react';
import { useLocation, Link } from 'react-router-dom';
import io from "socket.io-client";

import InfoBar from '../InfoBar/InfoBar';
import Input from '../Input/Input';
import Messages from '../Messages/Messages';
import UserContainer from '../UserContainer/UserContainer';

import ScrollToBottom from 'react-scroll-to-bottom';

let socket;

const Chat = () => {
  const location = useLocation();
  const [name,setName] = useState('');
  const [room, setRoom] = useState('');
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const ENDPOINT = import.meta.env.VITE_BACKEND_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(()=>{
    if (!location?.search) {
      setError('Please provide name and room parameters.');
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const name = urlParams.get('name');
    const room = urlParams.get('room');

    if (!name || !room) {
      setError('Name and room are required.');
      return;
    }

    setName(name);
    setRoom(room);

    try {
      socket = io(ENDPOINT, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        console.log('Connected to server');
        setError('');
        
        socket.emit('join',{name, room}, (error)=>{
          if(error) {
            setError(error);
          }
        });
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setError('Failed to connect to server. Please make sure the server is running.');
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        if (reason === 'io server disconnect') {
          socket.connect();
        }
      });

    } catch (err) {
      console.error('Socket initialization error:', err);
      setError('Failed to initialize connection');
    }

    return ()=>{
      if (socket) {
        socket.disconnect();
      }
    }
  },[ENDPOINT,location.search]);

  useEffect(()=>{
    if (!socket) return;

    const handleMessage = (message)=>{
      setMessages(prevMessages => [...prevMessages, message]);
    };

    const handleRoomData = ({ users }) => {
      setUsers(users);
    };

    const handleError = (error) => {
      setError(error);
    };

    socket.on('message', handleMessage);
    socket.on("roomData", handleRoomData);
    socket.on('error', handleError);

    return () => {
      socket.off('message', handleMessage);
      socket.off("roomData", handleRoomData);
      socket.off('error', handleError);
    };
  }, []);

  const sendMessage = (event)=>{
    event.preventDefault();

    if(message && socket?.connected){
      socket.emit('sendMessage',message, ()=> setMessage(''));
    } else if (!socket?.connected) {
      setError('Not connected to server');
    }
  }

  if (error && !name && !room) {
    return (
      <div className="flex justify-center text-center h-screen items-center bg-gray-900">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-red-600 text-2xl font-bold mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="flex w-full h-full md:h-[90vh] md:w-[95vw] max-w-[1400px] bg-white md:rounded-2xl shadow-2xl overflow-hidden">

        {/* Sidebar (User List) */}
        <div className="hidden md:flex flex-col w-80 bg-slate-900 border-r border-gray-800">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white tracking-wide">ChatRoom</h1>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <UserContainer users={users}/>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 bg-gray-50 relative">
          <InfoBar room={room} />

          {error && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-600 px-6 py-2 rounded-full shadow-md z-50 text-sm font-medium">
              {error}
            </div>
          )}

          <ScrollToBottom className="flex-1 overflow-y-auto scroll-smooth">
            <Messages messages={messages} name={name} />
            <div ref={messagesEndRef} />
          </ScrollToBottom>

          <Input 
              message={message} 
              setMessage={setMessage} 
              sendMessage={sendMessage}
              disabled={!socket?.connected}
            />
        </div>

      </div>
    </div>
  )
}

export default Chat;
