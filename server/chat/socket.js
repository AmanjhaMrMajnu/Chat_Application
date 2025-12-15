const { addUser, removeUser, getUser, getUsersOfRoom } = require('./users');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', ({name, room}, callback) => {
      const {error, user} = addUser({id: socket.id, name, room});

      if (error) {
        console.log('Join error:', error);
        return callback(error);
      }

      socket.join(user.room);
      console.log(`${user.name} joined room ${user.room}`);

      // Welcome message for user
      socket.emit('message', {
        user: "admin",
        text: `${user.name}, welcome to the room ${user.room}`,
        timestamp: new Date().toISOString()
      });

      // Message to all users in the room except the newly joined user
      socket.broadcast.to(user.room).emit('message', {
        user: 'admin',
        text: `${user.name} has joined`,
        timestamp: new Date().toISOString()
      });

      // Send updated room data
      io.to(user.room).emit('roomData', {
        room: user.room, 
        users: getUsersOfRoom(user.room)
      });

      callback();
    });

    // Handle user generated messages
    socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id);
      
      if (!user) {
        console.log('User not found for socket:', socket.id);
        return callback('User not found');
      }

      const messageData = {
        user: user.name,
        text: message,
        timestamp: new Date().toISOString()
      };

      io.to(user.room).emit('message', messageData);
      io.to(user.room).emit('roomData', {
        room: user.room, 
        users: getUsersOfRoom(user.room)
      });

      callback();
    });

    // Handle typing indicators (optional enhancement)
    socket.on('typing', (data) => {
      const user = getUser(socket.id);
      if (user) {
        socket.broadcast.to(user.room).emit('userTyping', {
          user: user.name,
          isTyping: data.isTyping
        });
      }
    });

    socket.on('disconnect', () => {
      const user = removeUser(socket.id);
      if (user) {
        console.log(`${user.name} disconnected from room ${user.room}`);
        io.to(user.room).emit('message', {
          user: 'admin',
          text: `${user.name} has left.`,
          timestamp: new Date().toISOString()
        });
        
        io.to(user.room).emit('roomData', {
          room: user.room,
          users: getUsersOfRoom(user.room)
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};
