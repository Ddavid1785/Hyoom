import { motion } from "framer-motion";
import { Database, BrainCircuit, ArrowRight } from "lucide-react";

interface MemoryBankSectionProps {
  onOpen: () => void;
}

export default function MemoryBankSection({ onOpen }: MemoryBankSectionProps) {
  return (
    <div className="pt-6 border-t border-zinc-800/50 space-y-6">
      <div className="flex items-center gap-2">
        <Database className="text-cyan-400" size={20} />
        <h3 className="text-lg font-medium text-white font-Inter">
          Memory Bank
        </h3>
      </div>

      <motion.button
        onClick={onOpen}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-1 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
      >
        <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 via-transparent to-blue-600/5 opacity-0 transition-opacity group-hover:opacity-100" />
        
        <div className="relative flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm group-hover:border-cyan-500/30 group-hover:shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)] transition-all duration-300">
              <BrainCircuit className="h-6 w-6 text-zinc-400 transition-colors group-hover:text-cyan-400" />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                Manage Long-term Memory
              </h4>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors max-w-sm">
                View and edit the specific details Hyoom has learned about you over time.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/50 text-zinc-400 transition-all group-hover:bg-cyan-500 group-hover:text-white">
            <ArrowRight size={16} />
          </div>
        </div>
      </motion.button>
    </div>
  );
}