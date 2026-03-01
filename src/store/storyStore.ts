import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Gender = 'male' | 'female' | 'lesbian';
export type StoryStatus = 'idle' | 'loading' | 'ongoing' | 'awkward_end' | 'orgasm_end';

export interface Choice {
  id: string;
  text: string;
  type: 'correct' | 'neutral' | 'wrong';
}

export interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

interface StoryStore {
  // Onboarding
  gender: Gender | null;
  setGender: (gender: Gender) => void;

  // Current session
  sessionId: string | null;
  scenarioId: string | null;
  arousalLevel: number;
  currentText: string;
  choices: Choice[];
  history: HistoryEntry[];
  status: StoryStatus;
  educationTip: string | null;

  // Actions
  setSession: (sessionId: string, scenarioId: string) => void;
  setStoryState: (data: {
    text: string;
    arousalDelta: number;
    choices: Choice[];
    status: StoryStatus;
    educationTip?: string;
  }) => void;
  appendHistory: (entry: HistoryEntry) => void;
  setLoading: (loading: boolean) => void;
  resetStory: () => void;
}

export const useStoryStore = create<StoryStore>()(
  persist(
    (set) => ({
      gender: null,
      setGender: (gender) => set({ gender }),

      sessionId: null,
      scenarioId: null,
      arousalLevel: 0,
      currentText: '',
      choices: [],
      history: [],
      status: 'idle',
      educationTip: null,

      setSession: (sessionId, scenarioId) =>
        set({ sessionId, scenarioId, arousalLevel: 0, history: [], status: 'ongoing' }),

      setStoryState: ({ text, arousalDelta, choices, status, educationTip }) =>
        set((state) => ({
          currentText: text,
          arousalLevel: Math.max(0, Math.min(100, state.arousalLevel + arousalDelta)),
          choices,
          status,
          educationTip: educationTip ?? null,
        })),

      appendHistory: (entry) =>
        set((state) => ({ history: [...state.history, entry] })),

      setLoading: (loading) => set({ status: loading ? 'loading' : 'ongoing' }),

      resetStory: () =>
        set({
          sessionId: null,
          scenarioId: null,
          arousalLevel: 0,
          currentText: '',
          choices: [],
          history: [],
          status: 'idle',
          educationTip: null,
        }),
    }),
    {
      name: 'intimora-store',
      partialize: (state) => ({ gender: state.gender }),
    }
  )
);
