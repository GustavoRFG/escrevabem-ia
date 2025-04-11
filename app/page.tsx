"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, SpellCheck2 } from "lucide-react";


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const sendToServer = async (endpoint: "/upload" | "/avaliar") => {
    if (!file) return;
    setLoading(true);
    setTranscription(null);
    setEvaluation(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`https://cf63-2804-1b2-11c0-8707-c114-e798-a406-5689.ngrok-free.app${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (endpoint === "/upload") setTranscription(data.transcription);
      if (endpoint === "/avaliar") setEvaluation(data.avaliacao);
    } catch (error) {
      setTranscription("Erro ao conectar com o backend.");
      setEvaluation("Erro ao conectar com o backend.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-100 via-white to-yellow-300 p-6 flex flex-col items-center">
            {/* LOGO */}
      <Image src="/logo.png" alt="Chatbot Logo" width={120} height={120} />
      <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-700 text-center mb-4">Redação IA</h1>
      <p className="text-gray-700 text-lg mb-6 text-center max-w-xl">Envie uma imagem da redação manuscrita, e veja a transcrição e avaliação instantaneamente com IA.</p>

      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-2xl border border-yellow-300">
        <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />

        {imagePreview && (
          <Image src={imagePreview} alt="Preview" width={400} height={400} className="mb-4 rounded-md shadow-md border border-gray-300" />
        )}

        <div className="flex gap-4 mb-4">
          <button onClick={() => sendToServer("/upload")}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded shadow">
            <Upload size={18} /> Transcrever
          </button>
          <button onClick={() => sendToServer("/avaliar")}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded shadow">
            <SpellCheck2 size={18} /> Avaliar
          </button>
        </div>

        {loading && <p className="text-yellow-700 font-semibold">⏳ Processando...</p>}

        {transcription && (
          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded p-4">
            <h2 className="text-lg font-bold text-yellow-700 mb-2">📝 Transcrição:</h2>
            <p className="whitespace-pre-line text-gray-800">{transcription}</p>
          </div>
        )}

        {evaluation && (
          <div className="mt-4 bg-blue-50 border border-blue-300 rounded p-4">
            <h2 className="text-lg font-bold text-blue-700 mb-2">📊 Avaliação:</h2>
            <p className="whitespace-pre-line text-gray-800">{evaluation}</p>
          </div>
        )}
      </div>

      <footer className="mt-8 text-sm text-gray-500">© {new Date().getFullYear()} Redação IA</footer>
    </main>
  );
}
