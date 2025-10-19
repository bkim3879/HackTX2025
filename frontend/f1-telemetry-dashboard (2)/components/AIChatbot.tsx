import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import DashboardPanel from './DashboardPanel';

interface AIChatbotProps {
    messages: ChatMessage[];
    input: string;
    isLoading: boolean;
    onInputChange: (value: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ messages, input, isLoading, onInputChange, onSendMessage }) => {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <DashboardPanel title="AI Strategy Chat" className="flex-grow min-h-[300px]">
            <div className="flex flex-col h-full">
                <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-3 text-sm custom-scrollbar">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-2 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-cyan-600' : 'bg-[#1e344a]'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="p-2 rounded-lg bg-[#1e344a] animate-pulse">
                                 ...
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={onSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Ask about strategy..."
                        disabled={isLoading}
                        className="flex-grow bg-[#0d1a26] border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                    />
                    <button type="submit" disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-500 rounded-md px-4 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                        Send
                    </button>
                </form>
            </div>
        </DashboardPanel>
    );
};

export default AIChatbot;
