
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store/useEditorStore";

const styles = ["Modern", "Minimal", "Professional", "Futuristic", "Bold", "Elegant", "Creative", "Corporate", "Academic", "Festival", "Technology"];
const formats = ["A4 Portrait", "A4 Landscape", "Square", "Story"];

export default function CreatePoster() {
  const router = useRouter();
  const setPoster = useEditorStore((state) => state.setPoster);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "AI Hackathon 2026",
    description: "Build the future with generative AI.",
    date: "October 15-17, 2026",
    time: "9:00 AM - 5:00 PM",
    venue: "Innovation Hub, San Francisco",
    organizer: "Tech Innovators",
    cta: "Register Now",
    contact: "hello@techinnovators.com",
    additionalDetails: "Prizes up to $50,000",
    style: "Modern",
    format: "A4 Portrait",
    preferredArchetype: "auto",
    preferredFontPairing: "auto",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDetails: {
            name: formData.name,
            description: formData.description,
            date: formData.date,
            time: formData.time,
            venue: formData.venue,
            organizer: formData.organizer,
            cta: formData.cta,
            contact: formData.contact,
            additionalDetails: formData.additionalDetails,
          },
          style: formData.style,
          format: formData.format,
          preferredArchetype: formData.preferredArchetype === "auto" ? undefined : formData.preferredArchetype,
          preferredFontPairing: formData.preferredFontPairing === "auto" ? undefined : formData.preferredFontPairing,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate poster");
      }

      setPoster({
        width: data.width,
        height: data.height,
        background: data.background,
        elements: data.elements,
        layoutArchetype: data.layoutArchetype,
        textSafeZone: data.textSafeZone,
        colorPalette: data.colorPalette,
        fontPairing: data.fontPairing,
      });

      router.push("/editor");
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-bold text-slate-900">Designing your poster...</h2>
          <div className="text-slate-500 space-y-2 text-sm">
            <p className="animate-pulse">Understanding your event details</p>
            <p className="animate-pulse animation-delay-200">Selecting typography & colors</p>
            <p className="animate-pulse animation-delay-400">Building visual hierarchy</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-900 text-white">
          <h1 className="text-2xl font-bold">Create New Poster</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your event details and let AI do the heavy lifting.</p>
        </div>
        
        <form onSubmit={handleGenerate} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Event Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="text" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <input type="text" name="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
                <input type="text" name="venue" value={formData.venue} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400"></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Call to Action</label>
                <input type="text" name="cta" value={formData.cta} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400" placeholder="e.g., Register Now" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact / Website</label>
                <input type="text" name="contact" value={formData.contact} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400" />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Design Preferences</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Design Style</label>
                <select name="style" value={formData.style} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400 bg-white">
                  {styles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                <select name="format" value={formData.format} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400 bg-white">
                  {formats.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Layout Archetype</label>
                <select name="preferredArchetype" value={formData.preferredArchetype} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400 bg-white">
                  <option value="auto">Auto (AI Determined)</option>
                  <option value="hero-top-text-bottom">Hero Top, Text Bottom</option>
                  <option value="hero-bottom-text-top">Text Top, Hero Bottom</option>
                  <option value="split-vertical">Split Vertical Columns</option>
                  <option value="centered-badge">Centered Floating Badge</option>
                  <option value="asymmetric-thirds">Asymmetric Thirds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typography Pairing</label>
                <select name="preferredFontPairing" value={formData.preferredFontPairing} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder-slate-400 bg-white">
                  <option value="auto">Auto (AI Determined)</option>
                  <option value="modern-bold">Modern Bold (Montserrat + Inter)</option>
                  <option value="editorial-serif">Editorial Serif (Playfair Display + Inter)</option>
                  <option value="high-impact">High Impact (Oswald + Inter)</option>
                  <option value="tech-futuristic">Tech Futuristic (Space Grotesk + Inter)</option>
                  <option value="clean-corporate">Clean Corporate (Plus Jakarta Sans + Inter)</option>
                  <option value="dramatic-cinematic">Dramatic Cinematic (Cinzel + Inter)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-sm transition-colors text-lg">
              Generate Poster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

