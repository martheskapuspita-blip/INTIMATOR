import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Gender = 'male' | 'female' | 'lesbian';
export type StoryStatus = 'idle' | 'loading' | 'ongoing' | 'awkward_end' | 'orgasm_end' | 'bad_end';

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
  arousalLevel: number;  // same as hotMeter (keeping backward compat)
  currentText: string;
  choices: Choice[];
  history: HistoryEntry[];
  status: StoryStatus;
  educationTip: string | null;
  eduLesson: string | null;    // Lesson after wrong choice (edu_lesson)
  eduPoints: number;           // Education points earned
  partNumber: number;          // Current story part (1-5)
  badEndReason: string | null; // Reason for bad end

  // Actions
  setSession: (sessionId: string, scenarioId: string) => void;
  setStoryState: (data: {
    text: string;
    arousalDelta: number;
    choices: Choice[];
    status: StoryStatus;
    educationTip?: string | null;
    eduLesson?: string | null;
    partNumber?: number;
    badEndReason?: string | null;
  }) => void;
  addEduPoints: (pts: number) => void;
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
      eduLesson: null,
      eduPoints: 0,
      partNumber: 1,
      badEndReason: null,

      setSession: (sessionId, scenarioId) =>
        set({ sessionId, scenarioId, arousalLevel: 0, history: [], status: 'ongoing', eduPoints: 0, partNumber: 1, eduLesson: null, badEndReason: null }),

      setStoryState: ({ text, arousalDelta, choices, status, educationTip, eduLesson, partNumber, badEndReason }) =>
        set((state) => ({
          currentText: text,
          arousalLevel: Math.max(0, Math.min(100, state.arousalLevel + arousalDelta)),
          choices,
          status,
          educationTip: educationTip ?? null,
          eduLesson: eduLesson ?? null,
          partNumber: partNumber ?? state.partNumber,
          badEndReason: badEndReason ?? null,
        })),

      addEduPoints: (pts) =>
        set((state) => ({ eduPoints: state.eduPoints + pts })),

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
          eduLesson: null,
          eduPoints: 0,
          partNumber: 1,
          badEndReason: null,
        }),
    }),
    {
      name: 'intimora-store',
      partialize: (state) => ({ gender: state.gender }),
    }
  )
);
