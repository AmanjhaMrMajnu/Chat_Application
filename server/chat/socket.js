const { addUser, removeUser, getUser, getUsersOfRoom } = require('./users');

module.exports = (io) => {
  // Socket.IO error handling
  io.engine.on('connection_error', (err) => {
    console.error('🔌 Socket.IO connection error:', {
      code: err.code,
      message: err.message,
      context: err.context
    });
  });

  io.on('connection', (socket) => {
    console.log('✅ New client connected:', socket.id);

    // Socket error handler
    socket.on('error', (error) => {
      console.error('❌ Socket error for', socket.id, ':', error);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error for', socket.id, ':', error.message);
    });

    socket.on('join', ({ name, room }, callback) => {
      try {
        // Validate input
        if (!name || !room) {
          const error = 'Name and room are required';
          console.log('⚠️  Join validation error:', error);
          return callback ? callback(error) : null;
        }

        if (typeof name !== 'string' || typeof room !== 'string') {
          const error = 'Name and room must be strings';
          console.log('⚠️  Join type error:', error);
          return callback ? callback(error) : null;
        }

        const { error, user } = addUser({ id: socket.id, name, room });

        if (error) {
          console.log('⚠️  Join error:', error);
          return callback ? callback(error) : null;
        }

        if (!user) {
          const err = 'Failed to add user';
          console.log('❌', err);
          return callback ? callback(err) : null;
        }

        socket.join(user.room);
        console.log(`👤 ${user.name} joined room ${user.room}`);

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
        try {
          const roomUsers = getUsersOfRoom(user.room);
          io.to(user.room).emit('roomData', {
            room: user.room,
            users: roomUsers
          });
        } catch (roomError) {
          console.error('❌ Error getting room data:', roomError);
        }

        if (callback) callback();
      } catch (error) {
        console.error('❌ Join handler error:', error);
        if (callback) callback('An error occurred while joining the room');
      }
    });

    // Handle user generated messages
    socket.on('sendMessage', (message, callback) => {
      try {
        // Validate message
        if (!message || typeof message !== 'string') {
          console.log('⚠️  Invalid message format');
          return callback ? callback('Invalid message format') : null;
        }

        if (message.length > 5000) {
          console.log('⚠️  Message too long');
          return callback ? callback('Message is too long (max 5000 characters)') : null;
        }

        const user = getUser(socket.id);

        if (!user) {
          console.log('⚠️  User not found for socket:', socket.id);
          return callback ? callback('User not found') : null;
        }

        const messageData = {
          user: user.name,
          text: message.trim(),
          timestamp: new Date().toISOString()
        };

        io.to(user.room).emit('message', messageData);

        try {
          const roomUsers = getUsersOfRoom(user.room);
          io.to(user.room).emit('roomData', {
            room: user.room,
            users: roomUsers
          });
        } catch (roomError) {
          console.error('❌ Error updating room data:', roomError);
        }

        if (callback) callback();
      } catch (error) {
        console.error('❌ sendMessage handler error:', error);
        if (callback) callback('Failed to send message');
      }
    });

    // Handle typing indicators (optional enhancement)
    socket.on('typing', (data) => {
      try {
        if (!data || typeof data !== 'object') {
          return;
        }

        const user = getUser(socket.id);
        if (user) {
          socket.broadcast.to(user.room).emit('userTyping', {
            user: user.name,
            isTyping: Boolean(data.isTyping)
          });
        }
      } catch (error) {
        console.error('❌ Typing handler error:', error);
      }
    });

    socket.on('disconnect', (reason) => {
      try {
        console.log(`🔌 Client disconnected: ${socket.id}, Reason: ${reason}`);
        const user = removeUser(socket.id);
        
        if (user) {
          console.log(`👋 ${user.name} disconnected from room ${user.room}`);
          
          io.to(user.room).emit('message', {
            user: 'admin',
            text: `${user.name} has left.`,
            timestamp: new Date().toISOString()
          });

          try {
            const roomUsers = getUsersOfRoom(user.room);
            io.to(user.room).emit('roomData', {
              room: user.room,
              users: roomUsers
            });
          } catch (roomError) {
            console.error('❌ Error updating room data on disconnect:', roomError);
          }
        }
      } catch (error) {
        console.error('❌ Disconnect handler error:', error);
      }
    });
  });
};
