import React from 'react';

const onlineIcon = 'https://cdn-icons-png.flaticon.com/512/906/906794.png';

const UserContainer = ({ users }) => (
  <div className="flex-1 overflow-y-auto p-6">
    {
      users
        ? (
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">Active Members</h3>
            <div className="space-y-4">
                {users.map(({name}) => (
                  <div key={name} className="flex items-center group cursor-default">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">{name.charAt(0).toUpperCase()}</div>
                      <img alt="Online" src={onlineIcon} className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-slate-900 rounded-full"/>
                    </div>
                    <span className="ml-3 text-slate-300 font-medium group-hover:text-white transition-colors">{name}</span>
                  </div>
                ))}
            </div>
          </div>
        )
        : null
    }
  </div>
);

export default UserContainer;