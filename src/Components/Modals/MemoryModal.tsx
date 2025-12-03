import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, BrainCircuit, Search, Calendar } from "lucide-react"; // Changed Brain to BrainCircuit
import { useState, useEffect } from "react";
import { Memory, useMemories } from "../../Hooks/useMemories";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryModal({ isOpen, onClose }: MemoryModalProps) {
  const { memories, loading, fetchMemories, deleteMemory } = useMemories();
  const [search, setSearch] = useState("");

  // Auto-fetch when opened
  useEffect(() => {
    if (isOpen) {
      fetchMemories();
      setSearch("");
    }
  }, [isOpen, fetchMemories]);

  const filteredMemories = memories.filter((m) =>
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-2xl bg-zinc-900/90 border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {/* Updated to Cyan and BrainCircuit */}
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <BrainCircuit className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-Inter">
                      Memory Bank
                    </h2>
                    <p className="text-sm text-zinc-400 font-Inter">
                      {memories.length} memories stored
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 py-4 border-b border-zinc-800 shrink-0">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={16}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search memories..."
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-Inter text-sm"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center h-40 text-zinc-500 font-Inter">
                    Loading neural pathways...
                  </div>
                ) : filteredMemories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-zinc-500 font-Inter gap-2">
                    <BrainCircuit size={32} className="opacity-20" />
                    <p>No matching memories found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMemories.map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        onDelete={deleteMemory}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MemoryCard({
  memory,
  onDelete,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      // REMOVED 'layout' prop here to fix the jittering bug
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-zinc-800/20 hover:bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all"
    >
      <div className="flex justify-between items-start gap-4">
        <p className="text-zinc-200 font-Inter text-sm leading-relaxed">
          {memory.content}
        </p>
        <button
          onClick={() => onDelete(memory.id)}
          className="shrink-0 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          title="Forget this memory"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500 font-Inter">
        <Calendar size={12} />
        <span>{new Date(memory.timestamp).toLocaleDateString()}</span>
        <span className="text-zinc-700">•</span>
        <span>{new Date(memory.timestamp).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}