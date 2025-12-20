import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Model } from "../shared/sharedTypes";
import { models as defaultModels } from "../../src-tauri/resources/denoBackend/LLM/LLMStatic";
import { fetch } from "@tauri-apps/plugin-http";

export function useCustomModels() {
  const [customModels, setCustomModels] = useState<Model[]>([]);
  const [allModels, setAllModels] = useState<Model[]>(defaultModels);
  const [loading, setLoading] = useState(true);

  // Load from Rust on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Update "allModels" whenever customModels changes
  useEffect(() => {
    setAllModels([...defaultModels, ...customModels]);
  }, [customModels]);

  const loadModels = async () => {
    try {
      setLoading(true);
      const saved = await invoke<Model[]>("load_custom_models");
      setCustomModels(saved || []);
    } catch (e) {
      console.error("Failed to load custom models", e);
    } finally {
      setLoading(false);
    }
  };

  const addModel = async (newModel: Model) => {
    const updated = [...customModels, newModel];
    setCustomModels(updated);
    await invoke("save_custom_models", { models: updated });
  };

  const removeModel = async (modelId: string) => {
    const updated = customModels.filter((m) => m.id !== modelId);
    setCustomModels(updated);
    await invoke("save_custom_models", { models: updated });
  };

  const fetchOllamaModels = useCallback(async (baseUrl: string = "http://localhost:11434") => {
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) throw new Error("Failed to connect to Ollama");
      const data = await response.json();
      return data.models.map((m: any) => ({
        id: m.name,
        name: m.name,
        size: m.size,
      }));
    } catch (error) {
      console.error("Ollama fetch error:", error);
      throw error;
    }
  }, []);

  const fetchLMStudioModels = useCallback(async (baseUrl: string = "http://localhost:1234") => {
    try {
       const response = await fetch(`${baseUrl}/v1/models`);
      if (!response.ok) throw new Error("Failed to connect to LM Studio");
      const data = await response.json();
      return data.data.map((m: any) => ({
        id: m.id,
        name: m.id.split('/').pop() || m.id,
      }));
    } catch (error) {
      console.error("LM Studio fetch error:", error);
      throw error;
    }
  }, []);

  return {
    allModels,
    customModels,
    loading,
    addModel,
    removeModel,
    fetchOllamaModels,
    fetchLMStudioModels
  };
}