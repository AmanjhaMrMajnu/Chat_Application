import React from 'react';

const sendIcon = 'https://cdn-icons-png.flaticon.com/512/3682/3682321.png';

const Input = ({ message, setMessage, sendMessage, disabled})=>(
  <form className="flex items-center p-4 bg-white border-t border-gray-200">
    <input 
      className="flex-1 bg-gray-100 text-gray-800 rounded-full px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all mr-3 text-sm" 
      type="text" 
      placeholder="Type a message..."
      value={message}
      onChange={(event)=> setMessage(event.target.value)}
      onKeyPress={(event)=> event.key === 'Enter' ? sendMessage(event):null}
      disabled={disabled}
    />
    <button 
      className="w-12 h-12 bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center group" 
      onClick={(event)=> sendMessage(event)}
      disabled={disabled || !message.trim()}
    >
      <img 
        className="w-5 h-5 filter invert brightness-0 group-hover:scale-110 transition-transform" 
        src={sendIcon} 
        alt="send"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    </button>
  </form>
)

export default Input;