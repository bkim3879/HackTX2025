import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TelemetryData, AdvancedAIPredictionsData, DriverId, SystemAlert, ChatMessage } from './types';
import { generateTelemetryData, generateAIPredictionData } from './services/telemetryService';
import Header from './components/Header';
import TelemetryGrid from './components/TelemetryGrid';
import AIPredictions from './components/AIPredictions';
import AIChatbot from './components/AIChatbot';
import { GoogleGenAI, Chat } from '@google/genai';

type ChatState = {
    messages: ChatMessage[];
    input: string;
    isLoading: boolean;
};

const initialChatState: ChatState = {
    messages: [{ sender: 'ai', text: "Ready for your query. Ask about strategy, performance, or telemetry." }],
    input: '',
    isLoading: false,
};

const App: React.FC = () => {
    const [driverId, setDriverId] = useState<DriverId>('VER');
    const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
    const [predictions, setPredictions] = useState<AdvancedAIPredictionsData | null>(null);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [activeTab, setActiveTab] = useState<'telemetry' | 'ai'>('telemetry');
    
    const [chatState, setChatState] = useState<Record<DriverId, ChatState>>({
        VER: { ...initialChatState, messages: [...initialChatState.messages] },
        HAM: { ...initialChatState, messages: [...initialChatState.messages] },
        LEC: { ...initialChatState, messages: [...initialChatState.messages] },
        NOR: { ...initialChatState, messages: [...initialChatState.messages] },
    });

    const chatRef = useRef<Record<DriverId, Chat | null>>({ VER: null, HAM: null, LEC: null, NOR: null });

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_GENAI_KEY as string | undefined;
        if (!apiKey) {
            console.error("Missing VITE_GOOGLE_GENAI_KEY environment variable.");
            return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = "You are an expert F1 race strategist AI assistant. Analyze the provided telemetry and prediction data to answer user questions concisely. Focus on actionable insights. The user is a race engineer.";

        (Object.keys(chatRef.current) as DriverId[]).forEach(id => {
            chatRef.current[id] = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
            });
        });
    }, []);


    const updateData = useCallback(() => {
        const newTelemetry = generateTelemetryData(driverId);
        const newPredictions = generateAIPredictionData();
        setTelemetry(newTelemetry);
        setPredictions(newPredictions);

        if (newTelemetry.systemAlerts.length > 0) {
            setAlerts(prevAlerts => {
                const existingIds = new Set(prevAlerts.map(a => a.id));
                const newUniqueAlerts = newTelemetry.systemAlerts.filter(a => !existingIds.has(a.id));
                return [...newUniqueAlerts, ...prevAlerts].slice(0, 10);
            });
        }
    }, [driverId]);

    useEffect(() => {
        updateData();
        const interval = setInterval(updateData, 1000);
        return () => clearInterval(interval);
    }, [updateData]);
    
    const handleDriverChange = (newDriverId: DriverId) => {
        setDriverId(newDriverId);
    };

    const handleChatInputChange = (value: string) => {
        setChatState(prev => ({
            ...prev,
            [driverId]: { ...prev[driverId], input: value }
        }));
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentChat = chatState[driverId];
        const currentChatSession = chatRef.current[driverId];
        const userInput = currentChat.input;

        if (!userInput.trim() || currentChat.isLoading || !currentChatSession) return;

        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        
        setChatState(prev => ({
            ...prev,
            [driverId]: {
                ...prev[driverId],
                messages: [...prev[driverId].messages, userMessage],
                input: '',
                isLoading: true,
            }
        }));

        try {
            const context = `CONTEXT:\nCurrent Telemetry Data: ${JSON.stringify(telemetry, null, 2)}\n\nCurrent AI Predictions: ${JSON.stringify(predictions, null, 2)}`;
            const result = await currentChatSession.sendMessage({ message: `${context}\n\nUSER QUESTION: ${userInput}` });
            const aiMessage: ChatMessage = { sender: 'ai', text: result.text };
            
            setChatState(prev => ({
                ...prev,
                [driverId]: { 
                    ...prev[driverId], 
                    messages: [...prev[driverId].messages, aiMessage],
                    isLoading: false
                }
            }));
        } catch (error) {
            console.error("Error sending message to AI:", error);
            const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, an error occurred. Please try again." };
            setChatState(prev => ({
                ...prev,
                [driverId]: { 
                    ...prev[driverId], 
                    messages: [...prev[driverId].messages, errorMessage],
                    isLoading: false 
                }
            }));
        }
    };

    if (!telemetry || !predictions) {
        return (
            <div className="bg-[#0d1a26] text-white min-h-screen flex items-center justify-center">
                <h1 className="text-2xl font-bold">Loading Telemetry Data...</h1>
            </div>
        );
    }

    const currentDriverChatState = chatState[driverId];

    return (
        <div className="bg-[#0d1a26] text-white min-h-screen p-4 md:p-6 font-sans">
            <Header driverId={driverId} lap={predictions.lap} onDriverChange={handleDriverChange} />
            
            <div className="mb-6">
                <div className="flex space-x-2 border-b border-gray-700">
                    <button onClick={() => setActiveTab('telemetry')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'telemetry' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'}`}>
                        Live Telemetry
                    </button>
                    <button onClick={() => setActiveTab('ai')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'ai' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'}`}>
                        AI Predictions
                    </button>
                </div>
            </div>

            <main>
                {activeTab === 'telemetry' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 xl:col-span-4">
                            <TelemetryGrid telemetry={telemetry} predictions={predictions} alerts={alerts} />
                        </div>
                        <div className="lg:col-span-1 xl:col-span-1 flex flex-col">
                            <AIChatbot 
                                messages={currentDriverChatState.messages}
                                input={currentDriverChatState.input}
                                isLoading={currentDriverChatState.isLoading}
                                onInputChange={handleChatInputChange}
                                onSendMessage={handleSendMessage}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="space-y-6">
                       <AIPredictions predictions={predictions} />
                       <AIChatbot
                            messages={currentDriverChatState.messages}
                            input={currentDriverChatState.input}
                            isLoading={currentDriverChatState.isLoading}
                            onInputChange={handleChatInputChange}
                            onSendMessage={handleSendMessage}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
