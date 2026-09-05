
"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { TextElement, ShapeElement } from "@/types/poster";
import { Trash2, CheckCircle2, AlertTriangle, Palette, Layers } from "lucide-react";
import { checkContrast } from "@/utils/contrast";
import { getFontPairing } from "@/utils/fontPairings";
import { getArchetypeDefinition } from "@/utils/archetypes";

export default function PropertiesPanel() {
  const { poster, selectedElementId, updateElement, removeElement, updateBackground, updateDimensions } = useEditorStore();

  const selectedElement = poster.elements.find(el => el.id === selectedElementId);

  if (!selectedElement) {
    const archetypeDef = poster.layoutArchetype ? getArchetypeDefinition(poster.layoutArchetype) : null;
    const fontDef = poster.fontPairing ? getFontPairing(poster.fontPairing) : null;

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

          {(archetypeDef || fontDef) && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Design Architecture</span>
              {archetypeDef && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{archetypeDef.name}</span>
                  </div>
                  <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">{archetypeDef.description}</p>
                </div>
              )}
              {fontDef && (
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    <span>{fontDef.label}</span>
                  </div>
                  <p className="text-slate-500 mt-1 text-[11px]">
                    Display: <span className="font-medium text-slate-700">{fontDef.displayFont}</span> • Body: <span className="font-medium text-slate-700">{fontDef.bodyFont}</span>
                  </p>
                </div>
              )}
            </div>
          )}
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
                <select 
                  value={(selectedElement as TextElement).fontFamily}
                  onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded outline-none text-slate-900 bg-white placeholder-slate-400 bg-white"
                >
                  <option value="Inter">Inter (Clean Body)</option>
                  <option value="Montserrat">Montserrat (Modern Bold)</option>
                  <option value="Playfair Display">Playfair Display (Editorial Serif)</option>
                  <option value="Oswald">Oswald (High Impact)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Corporate)</option>
                  <option value="Cinzel">Cinzel (Cinematic)</option>
                  <option value="Arial">Arial (System)</option>
                </select>
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
              {(() => {
                const contrast = checkContrast((selectedElement as TextElement).fill, poster.background);
                return (
                  <div
                    className={`mt-1.5 flex items-center space-x-1.5 text-xs px-2 py-1 rounded ${
                      contrast.pass
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {contrast.pass ? (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                    )}
                    <span className="font-medium text-[11px]">
                      Contrast {contrast.ratio}:1 ({contrast.score}) {contrast.pass ? "— WCAG Pass" : "— Low Contrast"}
                    </span>
                  </div>
                );
              })()}
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

