"use client";

import jsPDF from "jspdf";

import { useState } from "react";
import Image from "next/image";
import { Upload, SpellCheck2, CheckCircle2, FileDown } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "transcribed" | "confirmed">("idle");
  const [nivel, setNivel] = useState<string>("enem");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setEvaluation(null);
    setStatus("idle");
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const sendToServer = async (endpoint: "/upload" | "/avaliar", refine = false) => {
    if (!file) return;
    setLoading(true);
    if (endpoint === "/avaliar") setEvaluation(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("nivel", nivel);
    if (endpoint === "/avaliar") {
      formData.append("transcricao", transcription);
    }
    if (refine) {
      formData.append("refine", "true");
      formData.append("previous_transcription", transcription);
    }

    try {
      const res = await fetch(`https://cf63-2804-1b2-11c0-8707-c114-e798-a406-5689.ngrok-free.app${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (endpoint === "/upload") {
        setTranscription(data.transcription);
        setStatus("transcribed");
      }
      if (endpoint === "/avaliar") setEvaluation(data.avaliacao);
    } catch (error) {
      setTranscription("Erro ao conectar com o backend.");
      setEvaluation("Erro ao conectar com o backend.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmTranscription = () => {
    setStatus("confirmed");
  };

  const highlightDoubtfulParts = (text: string) => {
    const regex = /(\[.*?\])/g;
    return text.split(regex).map((part, idx) =>
      part.startsWith("[") && part.endsWith("]") ? (
        <mark key={idx} className="bg-yellow-300 px-1 rounded">{part}</mark>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Times", "normal");
    doc.setFontSize(12);

    doc.text(`Nível selecionado: ${nivel.toUpperCase()}\n\n`, 10, 10);

    doc.text("TRANSCRIÇÃO:\n", 10, 20);
    const lines1 = doc.splitTextToSize(transcription, 180);
    doc.text(lines1, 10, 30);

    doc.addPage();
    doc.text("AVALIAÇÃO:\n", 10, 10);
    const lines2 = doc.splitTextToSize(evaluation || "(sem avaliação ainda)", 180);
    doc.text(lines2, 10, 20);

    doc.save("redacao_ia.pdf");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-100 via-white to-yellow-300 p-6 flex flex-col items-center">
      <Image src="/logo.png" alt="Chatbot Logo" width={120} height={120} />
      <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-700 text-center mb-4">Redação IA</h1>
      <p className="text-gray-700 text-lg mb-6 text-center max-w-xl">Envie uma imagem da redação manuscrita, e veja a transcrição e avaliação instantaneamente com IA.</p>

      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-2xl border border-yellow-300">
        <label className="block mb-2 text-gray-700 font-semibold">Selecione o nível de correção:</label>
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="mb-6 border border-yellow-400 rounded p-2 text-gray-800 font-medium"
        >
          <option value="enem">Ensino Médio (ENEM)</option>
          <option value="pas">PAS (UnB)</option>
          <option value="fuvest">FUVEST</option>
          <option value="fund2final">Fundamental II (Finais - 8º e 9º anos)</option>
          <option value="fund2inicial">Fundamental II (6º ao 7º ano)</option>
          <option value="fund1final">Fundamental I (4º e 5º anos)</option>
          <option value="fund1inicial">Fundamental I (1º ao 3º ano)</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4 border-2 border-dashed border-yellow-400 rounded p-2 w-full cursor-pointer text-sm bg-yellow-50 hover:bg-yellow-100"
        />

        {imagePreview && (
          <Image src={imagePreview} alt="Preview" width={400} height={400} className="mb-4 rounded-md shadow-md border border-gray-300" />
        )}

        <div className="flex gap-4 mb-4 flex-wrap">
          <button
            onClick={() => sendToServer("/upload", status === "confirmed")}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded shadow"
          >
            <Upload size={18} /> {status === "idle" ? "Transcrever" : "Transcrever Novamente"}
          </button>

          <button
            onClick={confirmTranscription}
            disabled={status !== "transcribed"}
            className={`flex items-center gap-2 px-4 py-2 rounded shadow text-white font-bold ${status === "transcribed" ? "bg-green-400 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
          >
            <CheckCircle2 size={18} /> Confirmar Transcrição
          </button>

          <button
            onClick={() => sendToServer("/avaliar")}
            disabled={status !== "confirmed"}
            className={`flex items-center gap-2 px-4 py-2 rounded shadow text-white font-bold ${status === "confirmed" ? "bg-blue-400 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
          >
            <SpellCheck2 size={18} /> Avaliar
          </button>

          {status !== "idle" && (
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-purple-400 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded shadow"
            >
              <FileDown size={18} /> Exportar PDF
            </button>
          )}
        </div>

        {loading && <p className="text-yellow-700 font-semibold">⏳ Processando...</p>}

        {transcription && (
          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded p-4">
            <h2 className="text-lg font-bold text-yellow-700 mb-2">📝 Transcrição ({status === "confirmed" ? "confirmada" : "editável"}):</h2>
            {status === "confirmed" ? (
              <div className="whitespace-pre-wrap text-gray-800 font-mono">
                {highlightDoubtfulParts(transcription)}
              </div>
            ) : (
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                rows={10}
                className="w-full p-2 border rounded bg-white text-gray-800 whitespace-pre-line font-mono"
              />
            )}
          </div>
        )}

        {evaluation && (
          <div className="mt-4 bg-blue-50 border border-blue-300 rounded p-4">
            <h2 className="text-lg font-bold text-blue-700 mb-2">📊 Avaliação:</h2>
            <p className="whitespace-pre-line text-gray-800">{evaluation}</p>
            <p className="mt-2 text-sm text-blue-600 font-semibold">Nível selecionado: {nivel.toUpperCase()}</p>
          </div>
        )}
      </div>

      <footer className="mt-8 text-sm text-gray-500">© {new Date().getFullYear()} Redação IA</footer>
    </main>
  );
}