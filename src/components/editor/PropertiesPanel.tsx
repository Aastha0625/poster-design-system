
"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { TextElement, ShapeElement } from "@/types/poster";
import { Trash2 } from "lucide-react";

export default function PropertiesPanel() {
  const { poster, selectedElementId, updateElement, removeElement, updateBackground, updateDimensions } = useEditorStore();

  const selectedElement = poster.elements.find(el => el.id === selectedElementId);

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l p-6 flex flex-col space-y-6 overflow-y-auto z-10">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Canvas Properties</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Background Color</label>
            <div className="flex space-x-2">
              <input 
                type="color" 
                value={poster.background} 
                onChange={(e) => updateBackground(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
              <input 
                type="text" 
                value={poster.background} 
                onChange={(e) => updateBackground(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Width (px)</label>
              <input 
                type="number" 
                value={poster.width}
                onChange={(e) => updateDimensions(Number(e.target.value), poster.height)}
                className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Height (px)</label>
              <input 
                type="number" 
                value={poster.height}
                onChange={(e) => updateDimensions(poster.width, Number(e.target.value))}
                className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isText = selectedElement.type === "text";
  const isShape = selectedElement.type === "shape";

  return (
    <div className="w-80 bg-white border-l p-6 flex flex-col space-y-6 overflow-y-auto z-10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          {selectedElement.type} Properties
        </h3>
        <button 
          onClick={() => removeElement(selectedElement.id)}
          className="text-red-500 hover:bg-red-50 p-1.5 rounded"
          title="Delete element"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Common Properties */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">X</label>
            <input 
              type="number" 
              value={Math.round(selectedElement.x)}
              onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Y</label>
            <input 
              type="number" 
              value={Math.round(selectedElement.y)}
              onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Text Specific Properties */}
        {isText && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Content</label>
              <textarea 
                value={(selectedElement as TextElement).text}
                onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400 min-h-[80px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Font Size</label>
                <input 
                  type="number" 
                  value={(selectedElement as TextElement).fontSize}
                  onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Font Family</label>
                <input 
                  type="text" 
                  value={(selectedElement as TextElement).fontFamily}
                  onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Text Color</label>
              <div className="flex space-x-2">
                <input 
                  type="color" 
                  value={(selectedElement as TextElement).fill}
                  onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input 
                  type="text" 
                  value={(selectedElement as TextElement).fill}
                  onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Alignment</label>
              <select 
                value={(selectedElement as TextElement).align || "left"}
                onChange={(e) => updateElement(selectedElement.id, { align: e.target.value as any })}
                className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400 bg-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </>
        )}

        {/* Shape Specific Properties */}
        {isShape && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fill Color</label>
              <div className="flex space-x-2">
                <input 
                  type="color" 
                  value={(selectedElement as ShapeElement).fill}
                  onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input 
                  type="text" 
                  value={(selectedElement as ShapeElement).fill}
                  onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Width</label>
                <input 
                  type="number" 
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Height</label>
                <input 
                  type="number" 
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

