import { Bot, User } from "lucide-react";
import { Message } from "../../types";
import { motion, AnimatePresence } from "framer-motion";

interface QuickModeContextProps {
  messages: Message[];
}

export default function QuickModeContext({ messages }: QuickModeContextProps) {
  // Only show the last 2 messages
  const recentMessages = messages.slice(-2);
  
  if (recentMessages.length === 0) return null;

  return (
    <div className="w-full flex flex-col justify-end">
      <AnimatePresence mode="popLayout">
        {recentMessages.map((message, index) => {
          const isUser = message.role === "user";
          const isLast = index === recentMessages.length - 1;
          
          return (
            <motion.div
              layout
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: isLast ? 1 : 0.7, 
                scale: 1,
                y: 0 
              }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
              className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center mt-1">
                  <Bot size={16} className="text-blue-400" />
                </div>
              )}
              
              <div
                className={`
                  max-w-[85%] px-5 py-3 rounded-2xl font-Inter text-sm
                  backdrop-blur-md transition-all duration-300 shadow-sm
                  ${isUser 
                    ? "bg-blue-600/20 text-blue-50 border border-blue-500/20 rounded-br-sm" 
                    : "bg-zinc-800/60 text-zinc-100 border border-zinc-700/50 rounded-bl-sm"
                  }
                `}
              >
                {message.images && message.images.length > 0 && (
                  <div className="mb-3">
                    <div className={`flex flex-wrap gap-2 ${message.images.length === 1 ? '' : 'grid grid-cols-2'}`}>
                      {message.images.map((imageData, imgIndex) => (
                        <img 
                          key={imgIndex}
                          src={`data:image/jpeg;base64,${imageData}`}
                          alt="attachment"
                          className="rounded-lg object-cover max-h-48 w-full border border-white/10"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="leading-relaxed whitespace-pre-wrap text-[15px]">
                  {message.content}
                </p>
              </div>

              {isUser && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center mt-1">
                  <User size={16} className="text-zinc-300" />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}