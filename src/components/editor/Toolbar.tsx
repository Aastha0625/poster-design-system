
"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { v4 as uuidv4 } from "uuid";
import { 
  Type, Square, Circle as CircleIcon, Minus, 
  Undo, Redo, Download, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { exportCanvasToImage } from "@/utils/export";

export default function Toolbar() {
  const { addElement, undo, redo, history, historyStep } = useEditorStore();

  const handleAddText = () => {
    addElement({
      id: uuidv4(),
      type: "text",
      text: "New Text",
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: 32,
      fontFamily: "Arial",
      fill: "#000000",
      align: "center",
    });
  };

  const handleAddShape = (shapeType: "rectangle" | "circle" | "line") => {
    addElement({
      id: uuidv4(),
      type: "shape",
      shapeType,
      x: 150,
      y: 150,
      width: 100,
      height: 100,
      fill: "#3b82f6",
    });
  };

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 z-10 shadow-sm">
      <div className="flex items-center space-x-4">
        <Link href="/create" className="text-slate-500 hover:text-slate-900 flex items-center space-x-1">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">New</span>
        </Link>
        <div className="h-6 w-px bg-slate-200"></div>
        <div className="flex items-center space-x-1">
          <button onClick={handleAddText} className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Add Text">
            <Type className="w-5 h-5" />
          </button>
          <button onClick={() => handleAddShape("rectangle")} className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Add Rectangle">
            <Square className="w-5 h-5" />
          </button>
          <button onClick={() => handleAddShape("circle")} className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Add Circle">
            <CircleIcon className="w-5 h-5" />
          </button>
          <button onClick={() => handleAddShape("line")} className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Add Line">
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={undo} 
          disabled={historyStep === 0}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" 
          title="Undo"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button 
          onClick={redo} 
          disabled={historyStep === history.length - 1}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" 
          title="Redo"
        >
          <Redo className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        <button 
          onClick={() => exportCanvasToImage("poster-canvas", "poster.png")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}

