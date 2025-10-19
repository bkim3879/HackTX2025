import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TelemetryTickDTO, RecommendationDTO, DriverId, ChatMessage } from './types';
import { fetchCurrentRecommendation, fetchLatestTelemetry } from './services/apiClient';
import Header from './components/Header';
import TelemetryGrid from './components/TelemetryGrid';
import AIPredictions from './components/AIPredictions';
import AIChatbot from './components/AIChatbot';
import { GoogleGenAI, Chat } from '@google/genai';
import { DRIVER_OPTIONS, DRIVER_LABEL_BY_ID } from './constants/drivers';

type ChatState = {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
};

const initialChatState: ChatState = {
  messages: [
    {
      sender: 'ai',
      text: 'Ready for your query. Ask about strategy, performance, or telemetry.',
    },
  ],
  input: '',
  isLoading: false,
};

const DEFAULT_RACE_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_RACE_ID) || 'demo_race';

const REFRESH_INTERVAL_MS = 3500;

const App: React.FC = () => {
  const [driverId, setDriverId] = useState<DriverId>(DRIVER_OPTIONS[0]?.value ?? 'driver_1');
  const [telemetry, setTelemetry] = useState<TelemetryTickDTO | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationDTO | null>(null);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'ai' | 'strategyLab'>('telemetry');
  const [aiError, setAiError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const [chatState, setChatState] = useState<Record<DriverId, ChatState>>(
    DRIVER_OPTIONS.reduce((acc, option) => {
      acc[option.value] = { ...initialChatState, messages: [...initialChatState.messages] };
      return acc;
    }, {} as Record<DriverId, ChatState>),
  );

  const chatRef = useRef<Record<DriverId, Chat | null>>({
    VER: null,
    HAM: null,
    LEC: null,
    NOR: null,
  });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_GENAI_KEY as string | undefined;
    if (!apiKey) {
      console.error('Missing VITE_GOOGLE_GENAI_KEY environment variable.');
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction =
      'You are an expert F1 race strategist AI assistant. Analyze the provided telemetry and prediction data to answer user questions concisely. Focus on actionable insights. The user is a race engineer.';

    (Object.keys(chatRef.current) as DriverId[]).forEach((id) => {
      chatRef.current[id] = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
      });
    });
  }, []);

  const updateData = useCallback(async () => {
    try {
      const [telemetryResponse, recommendationResponse] = await Promise.all([
        fetchLatestTelemetry(DEFAULT_RACE_ID, driverId),
        fetchCurrentRecommendation(DEFAULT_RACE_ID, driverId),
      ]);

      setTelemetry(telemetryResponse);
      setRecommendation(recommendationResponse);
      setDataError(null);
    } catch (error) {
      console.error('Error fetching data from backend:', error);
      setTelemetry(null);
      setRecommendation(null);
      setDataError('Unable to fetch latest data from backend.');
    }
  }, [driverId]);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [updateData]);

  const handleDriverChange = (newDriverId: DriverId) => {
    setDriverId(newDriverId);
    if (!chatState[newDriverId]) {
      setChatState((prev) => ({
        ...prev,
        [newDriverId]: { ...initialChatState, messages: [...initialChatState.messages] },
      }));
    }
  };

  const handleChatInputChange = (value: string) => {
    setChatState((prev) => ({
      ...prev,
      [driverId]: { ...prev[driverId], input: value },
    }));
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentChat = chatState[driverId];
    const currentChatSession = chatRef.current[driverId];
    const userInput = currentChat.input;

    if (!userInput.trim() || currentChat.isLoading || !currentChatSession) return;
    if (aiError) {
      console.warn('AI send attempted while AI assistant unavailable.');
      return;
    }

    const userMessage: ChatMessage = { sender: 'user', text: userInput };

    setChatState((prev) => ({
      ...prev,
      [driverId]: {
        ...prev[driverId],
        messages: [...prev[driverId].messages, userMessage],
        input: '',
        isLoading: true,
      },
    }));

    try {
      const context = `CONTEXT:
Current Telemetry Data: ${JSON.stringify(telemetry, null, 2)}

Current Recommendation: ${JSON.stringify(recommendation, null, 2)}`;

      const result = await currentChatSession.sendMessage({
        message: `${context}\n\nUSER QUESTION: ${userInput}`,
      });

      const aiMessage: ChatMessage = { sender: 'ai', text: result.text };
      setChatState((prev) => ({
        ...prev,
        [driverId]: {
          ...prev[driverId],
          messages: [...prev[driverId].messages, aiMessage],
          isLoading: false,
        },
      }));
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const errorMessage: ChatMessage = {
        sender: 'ai',
        text: 'Sorry, an error occurred. Please try again.',
      };
      setChatState((prev) => ({
        ...prev,
        [driverId]: {
          ...prev[driverId],
          messages: [...prev[driverId].messages, errorMessage],
          isLoading: false,
        },
      }));
      setAiError('AI assistant encountered an error. Please verify credentials.');
    }
  };

  const currentDriverChatState = chatState[driverId];

  return (
    <div className="bg-[#0d1a26] text-white min-h-screen p-4 md:p-6 font-sans">
      <Header
        driverId={driverId}
        lap={telemetry?.lap ?? 0}
        onDriverChange={handleDriverChange}
        driverOptions={DRIVER_OPTIONS}
      />

      {aiError && (
        <div className="mb-4 rounded border border-red-500 bg-red-900/40 px-4 py-3 text-sm text-red-100">
          {aiError}
        </div>
      )}

      {dataError && (
        <div className="mb-4 rounded border border-yellow-500 bg-yellow-900/40 px-4 py-3 text-sm text-yellow-100">
          {dataError}
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'telemetry' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'
            }`}
          >
            Live Telemetry
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'ai' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'
            }`}
          >
            AI Predictions
          </button>
          <button
            onClick={() => setActiveTab('strategyLab')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'strategyLab' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'
            }`}
          >
            Strategy Lab
          </button>
        </div>
      </div>

      <main>
        {activeTab === 'telemetry' && (
          <TelemetryGrid
            telemetry={telemetry}
            recommendation={recommendation}
            driverLabelMap={DRIVER_LABEL_BY_ID}
          />
        )}

        {activeTab === 'ai' && (
          <AIPredictions
            recommendation={recommendation}
            telemetry={telemetry}
            driverLabelMap={DRIVER_LABEL_BY_ID}
          />
        )}

        {activeTab === 'strategyLab' && (
          <div className="mx-auto w-full max-w-[1200px] px-3 sm:px-6 lg:px-12">
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
