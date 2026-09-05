
import Link from "next/link";
import { Sparkles, Palette, MousePointer2, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl text-center space-y-8">
        <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>AI-Assisted Design</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
          Create professional posters with AI. <br className="hidden md:block" />
          <span className="text-blue-600">Then make them your own.</span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Enter your event details. Let our AI handle the difficult first step of designing the layout, typography, and colors. Retain full creative control in our graphical editor.
        </p>
        
        <div className="pt-8">
          <Link 
            href="/create" 
            className="bg-slate-900 hover:bg-slate-800 text-white text-lg font-medium px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Create Poster
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-24 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">1. AI Generation</h3>
            <p className="text-slate-600">Provide structured event information and choose a style. The AI builds a beautiful, coherent initial layout.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
              <MousePointer2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">2. Visual Editor</h3>
            <p className="text-slate-600">Open the generated design in a full canvas editor. Move, resize, and edit every individual element to perfection.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">3. Export High-Res</h3>
            <p className="text-slate-600">Download your final masterpiece as a high-quality PNG ready for printing or social media sharing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

