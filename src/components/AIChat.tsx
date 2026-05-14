import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { geminiService } from '@/src/services/geminiService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your Stockflow12 AI Assistant. How can I help you manage your inventory today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryStats, setInventoryStats] = useState({ totalItems: 0, totalValue: 0, lowStockCount: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsub = onSnapshot(q, (snapshot) => {
      const stats = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        acc.totalItems += (data.quantity || 0);
        acc.totalValue += (data.quantity || 0) * (data.purchasePrice || 0);
        if (data.quantity <= (data.minStockLevel || 5)) acc.lowStockCount++;
        return acc;
      }, { totalItems: 0, totalValue: 0, lowStockCount: 0 });
      setInventoryStats(stats);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await geminiService.getChatResponse(userMessage, { 
        inventoryCount: inventoryStats.totalItems, 
        inventoryValue: inventoryStats.totalValue,
        lowStockItems: inventoryStats.lowStockCount 
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="mb-4 w-[350px] md:w-[400px]"
          >
            <Card className="bg-slate-900 border-slate-800 shadow-2xl h-[500px] flex flex-col overflow-hidden">
              <CardHeader className="p-4 border-b border-slate-800 bg-slate-950 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-orange-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  System Intelligence
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-slate-500">
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex gap-3",
                      m.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        m.role === 'user' ? "bg-slate-800" : "bg-orange-600/20 text-orange-500"
                      )}>
                        {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm",
                        m.role === 'user' 
                          ? "bg-orange-600 text-white rounded-tr-none" 
                          : "bg-slate-800 text-slate-200 rounded-tl-none"
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-600/20 text-orange-500 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1">
                        <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-slate-800 bg-slate-950">
                <div className="relative">
                  <Input 
                    placeholder="Ask about inventory..." 
                    className="bg-slate-900 border-slate-800 pr-10 focus:border-orange-500/50 text-white"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-1 top-1 h-8 w-8 bg-orange-600 hover:bg-orange-700"
                    onClick={handleSend}
                    disabled={isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 flex gap-1 items-center justify-center">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] text-slate-500 font-medium">AI Insights enabled</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-orange-600 text-white hover:bg-orange-700 hover:scale-110"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>
    </div>
  );
};
