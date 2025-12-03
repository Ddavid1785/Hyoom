import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { StoredMemory } from '../shared/sharedTypes';

export type Memory = Omit<StoredMemory, "embedding">

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<Memory[]>("load_memories");
      setMemories(data);
    } catch (error) {
      console.error("Failed to load memories", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMemory = async (id: string) => {
    try {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      await invoke("delete_memory", { id });
    } catch (error) {
      console.error("Failed to delete memory", error);
      fetchMemories(); 
    }
  };

  return { memories, loading, fetchMemories, deleteMemory };
}