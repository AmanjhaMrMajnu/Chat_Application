const mongoose = require('mongoose');
const users = [];

const addUser = ({id, name, room})=>{
  if(!name || !room) return { error: 'Username and room are required.' };

  name=name.trim().toLowerCase();
  room=room.trim().toLowerCase();

  const existingUserCheck = users.find((user)=>user.room === room && user.name === name);
  if(existingUserCheck){
    return {error:'Username is already taken'};
  }

  const user = {id, name, room};
  users.push(user);

  return {user};
}

const removeUser = (id)=>{
  const index = users.findIndex((user)=>user.id===id);
  if(index !== -1){
    return users.splice(index,1)[0];
  }
}

const getUser = (id)=>{
  return users.find((user)=>user.id === id)
}

const getUsersOfRoom = (room)=> users.filter((user)=>user.room === room);

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Added Name
    email: { type: String, required: true, unique: true }, // Added Email
    password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

module.exports = {addUser, removeUser, getUser, getUsersOfRoom, User};
