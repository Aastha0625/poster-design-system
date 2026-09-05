
import { create } from "zustand";
import { PosterState, PosterElement } from "@/types/poster";

interface EditorState {
  poster: PosterState;
  selectedElementId: string | null;
  history: PosterState[];
  historyStep: number;
  
  // Actions
  setPoster: (poster: PosterState) => void;
  addElement: (element: PosterElement) => void;
  updateElement: (id: string, updates: Partial<PosterElement>) => void;
  removeElement: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  updateBackground: (color: string) => void;
  updateDimensions: (width: number, height: number) => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
}

const defaultPoster: PosterState = {
  width: 794, // A4 pixel width at 96dpi
  height: 1123,
  background: "#ffffff",
  elements: [],
};

export const useEditorStore = create<EditorState>((set, get) => ({
  poster: defaultPoster,
  selectedElementId: null,
  history: [defaultPoster],
  historyStep: 0,

  setPoster: (poster) => set({ 
    poster, 
    history: [poster], 
    historyStep: 0, 
    selectedElementId: null 
  }),

  saveHistory: () => {
    const { poster, history, historyStep } = get();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(JSON.parse(JSON.stringify(poster)));
    set({
      history: newHistory,
      historyStep: newHistory.length - 1,
    });
  },

  addElement: (element) => {
    get().saveHistory();
    set((state) => ({
      poster: {
        ...state.poster,
        elements: [...state.poster.elements, element],
      },
      selectedElementId: element.id,
    }));
  },

  updateElement: (id, updates) => {
    set((state) => ({
      poster: {
        ...state.poster,
        elements: state.poster.elements.map((el) =>
          el.id === id ? { ...el, ...updates } as PosterElement : el
        ),
      },
    }));
  },

  removeElement: (id) => {
    get().saveHistory();
    set((state) => ({
      poster: {
        ...state.poster,
        elements: state.poster.elements.filter((el) => el.id !== id),
      },
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
  },

  setSelectedElementId: (id) => set({ selectedElementId: id }),

  updateBackground: (color) => {
    get().saveHistory();
    set((state) => ({
      poster: {
        ...state.poster,
        background: color,
      },
    }));
  },
  
  updateDimensions: (width, height) => {
    get().saveHistory();
    set((state) => ({
      poster: {
        ...state.poster,
        width,
        height,
      },
    }));
  },

  undo: () => {
    const { history, historyStep } = get();
    if (historyStep > 0) {
      set({
        historyStep: historyStep - 1,
        poster: JSON.parse(JSON.stringify(history[historyStep - 1])),
        selectedElementId: null,
      });
    }
  },

  redo: () => {
    const { history, historyStep } = get();
    if (historyStep < history.length - 1) {
      set({
        historyStep: historyStep + 1,
        poster: JSON.parse(JSON.stringify(history[historyStep + 1])),
        selectedElementId: null,
      });
    }
  },
}));

