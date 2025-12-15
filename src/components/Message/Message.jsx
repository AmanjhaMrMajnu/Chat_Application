import React from 'react';
import ReactEmoji from 'react-emoji';

const Message = ({message:{text,user},name})=>{
  let isSentByCurrentUser = false;
  const trimmedName = name.trim().toLowerCase();
  if(user === trimmedName){
    isSentByCurrentUser=true;
  }

  const renderText = () => {
    try {
      return ReactEmoji.emojify(text, { attributes: { style: { width: '24px', height: '24px', display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' } } });
    } catch (e) {
      console.warn('Error parsing emoji:', e);
      return text;
    }
  };

  return (
    isSentByCurrentUser ? (
      <div className="flex justify-end px-6 py-2">
        <div className="flex flex-col items-end max-w-[75%]">
          <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md">
            <p className="text-sm leading-relaxed break-words">{renderText()}</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 pr-1 font-medium">You</p>
        </div>
      </div>
    ) : (
      <div className="flex justify-start px-6 py-2">
        <div className="flex flex-col items-start max-w-[75%]">
          <div className="bg-white text-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
            <p className="text-sm leading-relaxed break-words">{renderText()}</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 pl-1 font-medium capitalize">{user}</p>
        </div>
      </div>
    )
  )
}

export default Message;
