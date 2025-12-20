import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Server, AlertCircle } from "lucide-react";
import { Model } from "../../shared/sharedTypes";
import { useToast } from "../../Context/ToastContext";

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (model: Model) => void;
  fetchOllama: (url?: string) => Promise<any[]>;
  fetchLMStudio: (url?: string) => Promise<any[]>;
}

export default function AddModelModal({
  isOpen,
  onClose,
  onAdd,
  fetchOllama,
  fetchLMStudio,
}: AddModelModalProps) {
  // State
  const [importProvider, setImportProvider] = useState<"ollama" | "lmstudio">(
    "ollama"
  );
  const [foundModels, setFoundModels] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [importUrl, setImportUrl] = useState(""); // Optional custom URL
  const { addToast } = useToast();

  const handleFetch = async () => {
    setIsFetching(true);
    setFetchError("");
    setFoundModels([]);

    try {
      let results;
      if (importProvider === "ollama") {
        results = await fetchOllama(importUrl || "http://localhost:11434");
      } else {
        results = await fetchLMStudio(importUrl || "http://localhost:1234");
      }
      setFoundModels(results);
    } catch (err) {
      setFetchError(
        "Could not connect. Ensure the app is running and CORS is allowed (or use default ports)."
      );
    } finally {
      setIsFetching(false);
    }
  };

  const handleImportModel = (importedModel: any) => {
    const isOllama = importProvider === "ollama";
    const id = isOllama
      ? `ollama-${importedModel.id}`
      : `lms-${importedModel.id}`;

    const newModel: Model = {
      id: id,
      displayName: importedModel.name,
      creator: isOllama ? "Ollama" : "LM Studio",
      iconPath: isOllama
        ? "/LLMProviderIcons/Ollama/ollama.png"
        : "/LLMProviderIcons/LMStudio/lmstudio.webp",
      capabilities: {
        vision: false,
        imageGeneration: false,
        functionCalling: true,
      },
      providerModelIds: {
        openai: null,
        anthropic: null,
        google: null,
        groq: null,
        openrouter: null,
        moonshot: null,
        ollama: isOllama ? importedModel.id : null,
        lmstudio: !isOllama ? importedModel.id : null,
      },
    };

    onAdd(newModel);
    addToast("Model added successfully", "success");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white font-Inter">
            Import Local Model
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Provider Selection */}
          <div className="flex gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="prov"
                checked={importProvider === "ollama"}
                onChange={() => {setImportProvider("ollama");
                  setFoundModels([]);
                }}
                className="accent-blue-500 cursor-pointer"
              />
              <span className="text-zinc-300 text-sm group-hover:text-white transition-colors">
                Ollama
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="prov"
                checked={importProvider === "lmstudio"}
                onChange={() => {setImportProvider("lmstudio");
                  setFoundModels([]);
                }}
                className="accent-blue-500 cursor-pointer"
              />
              <span className="text-zinc-300 text-sm group-hover:text-white transition-colors">
                LM Studio
              </span>
            </label>
          </div>

          {/* URL Input & Fetch */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={
                    importProvider === "ollama"
                      ? "http://localhost:11434"
                      : "http://localhost:1234"
                  }
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full bg-black/20 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={handleFetch}
                disabled={isFetching}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isFetching ? "..." : <Server size={16} />}
                Fetch
              </button>
            </div>

            {fetchError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 items-start text-red-200 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {fetchError}
              </div>
            )}

            {/* Results List */}
            <div className="space-y-2 mt-4">
              {foundModels.length > 0 && (
                <p className="text-xs text-zinc-500 uppercase font-bold">
                  Available Models
                </p>
              )}

              {foundModels.map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-lg group hover:border-blue-500/30 transition-colors"
                >
                  <div className="flex flex-col overflow-hidden mr-3">
                    <span className="text-zinc-200 font-medium text-sm truncate">
                      {m.name}
                    </span>
                    <span className="text-zinc-500 text-xs truncate">
                      {m.id}
                    </span>
                  </div>
                  <button
                    onClick={() => handleImportModel(m)}
                    className="bg-zinc-700 hover:bg-blue-600 text-white p-1.5 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Import this model"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}

              {!isFetching && foundModels.length === 0 && !fetchError && (
                <div className="text-center py-8">
                  <p className="text-zinc-500 text-sm">
                    Select a provider and click Fetch to find local models.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
