
"use client";

import dynamic from "next/dynamic";
import { useEditorStore } from "@/store/useEditorStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Toolbar from "@/components/editor/Toolbar";
import PropertiesPanel from "@/components/editor/PropertiesPanel";

// Konva must be dynamically imported with ssr: false
const Canvas = dynamic(() => import("@/components/editor/Canvas"), { ssr: false });

export default function EditorPage() {
  const router = useRouter();
  const poster = useEditorStore((state) => state.poster);
  const elements = useEditorStore((state) => state.poster.elements);

  useEffect(() => {
    if (elements.length === 0 && poster.background === "#ffffff") {
      // No poster generated, redirect to create
      // router.push("/create");
    }
  }, [elements, poster.background, router]);

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative" id="canvas-container">
          <div className="shadow-2xl ring-1 ring-black/5 bg-white transition-transform">
            <Canvas />
          </div>
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}

