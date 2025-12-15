import React from 'react';

import Message from '../Message/Message';

const Messages = ({ messages, name }) => (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
    {messages.map((message, i) => <div key={i}><Message message={message} name={name}/></div>)}
    </div>
);

export default Messages;

