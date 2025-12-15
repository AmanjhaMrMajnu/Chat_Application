import React from 'react';

const closeIcon = 'https://cdn-icons-png.flaticon.com/512/2976/2976286.png';
const onlineIcon = 'https://cdn-icons-png.flaticon.com/512/906/906794.png';

const InfoBar = ({room})=>(
  <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm z-10">
    <div className="flex items-center gap-3">
      <img className="w-2.5 h-2.5" src={onlineIcon} alt="online" />
      <h3 className="text-lg font-bold text-gray-800 capitalize tracking-wide">{room}</h3>
    </div>
    <div className="flex justify-end">
      <a href="/" className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"><img src={closeIcon} alt="close" className="w-3.5 h-3.5 opacity-50 hover:opacity-100" /></a>
    </div>
  </div>
)

export default InfoBar;