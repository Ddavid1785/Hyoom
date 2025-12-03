import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { Message } from "../../types";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center mt-1">
          <Bot size={18} className="text-blue-400" />
        </div>
      )}
      
      <div
        className={`
          max-w-[70%] rounded-2xl font-Inter shadow-sm
          ${isUser 
            ? "bg-blue-600 text-white rounded-br-sm" 
            : "bg-zinc-800/40 backdrop-blur-sm text-zinc-100 border border-zinc-700/50 rounded-bl-sm"
          }
        `}
      >
        {message.images && message.images.length > 0 && (
          <div className="p-2 pb-0">
            <div className={`flex flex-wrap gap-2 ${message.images.length === 1 ? '' : 'grid grid-cols-2'}`}>
              {message.images.map((imageData, index) => (
                <img 
                  key={index}
                  src={imageData}
                  alt={`Uploaded ${index + 1}`}
                  className={`rounded-lg object-contain bg-black/20 ${
                    message.images!.length === 1 
                      ? 'max-w-full h-auto max-h-64' 
                      : 'w-full h-32 object-cover'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="px-5 py-3">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>

      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center mt-1">
          <User size={18} className="text-zinc-300" />
        </div>
      )}
    </motion.div>
  );
}