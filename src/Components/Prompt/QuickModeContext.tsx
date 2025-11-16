import { Bot, User } from "lucide-react";
import { Message } from "../../types";
import { motion, AnimatePresence } from "framer-motion";

interface QuickModeContextProps {
  messages: Message[];
}

export default function QuickModeContext({ messages }: QuickModeContextProps) {
  const recentMessages = messages.slice(-2);
  
  if (recentMessages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full pointer-events-auto"
    >
      <AnimatePresence mode="popLayout">
        {recentMessages.map((message, index) => {
          const isUser = message.role === "user";
          const isLast = index === recentMessages.length - 1;
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isLast ? 0.9 : 0.5,
                y: 0 
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex gap-3 mb-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <Bot size={14} className="text-blue-400" />
                </div>
              )}
              
              <div
                className={`
                  max-w-[75%] px-4 py-2.5 rounded-xl font-Inter text-sm
                  backdrop-blur-sm transition-all duration-300
                  ${isUser 
                    ? "bg-blue-600/30 text-white/80 border border-blue-500/20" 
                    : "bg-zinc-800/30 text-white/80 border border-zinc-700/30"
                  }
                  ${isLast ? "shadow-lg" : ""}
                `}
              >
                {message.images && message.images.length > 0 && (
                  <div className="mb-2">
                    <div className={`flex flex-wrap gap-1.5 ${message.images.length === 1 ? '' : 'grid grid-cols-2'}`}>
                      {message.images.map((imageData, imgIndex) => (
                        <img 
                          key={imgIndex}
                          src={`data:image/jpeg;base64,${imageData}`}
                          alt={`Uploaded ${imgIndex + 1}`}
                          className={`rounded-lg object-contain ${
                            message.images!.length === 1 
                              ? 'max-w-full h-auto max-h-32' 
                              : 'w-full h-20 object-cover'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>

              {isUser && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-zinc-700/40 flex items-center justify-center">
                  <User size={14} className="text-zinc-300" />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="h-px bg-linear-to-r from-transparent via-zinc-700/50 to-transparent mt-4"
      />
    </motion.div>
  );
}