"use client";

import { useRef, useState, DragEvent, ChangeEvent, useEffect } from "react";
import { ArrowUpFromLine, Zap, Loader2, Camera, X, RotateCcw } from "lucide-react";
import { calculateNutritionScore, type NutritionGrade, type UserNutritionData } from "@/lib/nutri-score";
import Footer from "@/components/Footer";

interface Props {
  onAnalyze: (file: File, previewUrl: string) => void;
}

// Grade colors matching Nutri-Score system
const GRADE_COLORS = {
  A: { bg: "#00b67a", text: "#ffffff", glow: "0 0 40px #00b67a, 0 0 80px #00b67a" },
  B: { bg: "#85bb2f", text: "#ffffff", glow: "0 0 40px #85bb2f, 0 0 80px #85bb2f" },
  C: { bg: "#ffb800", text: "#ffffff", glow: "0 0 40px #ffb800, 0 0 80px #ffb800" },
  D: { bg: "#e2703a", text: "#ffffff", glow: "0 0 40px #e2703a, 0 0 80px #e2703a" },
  E: { bg: "#ef3f23", text: "#ffffff", glow: "0 0 40px #ef3f23, 0 0 80px #ef3f23" },
};

const GRADE_LABELS = {
  A: "Sangat Baik",
  B: "Baik",
  C: "Cukup",
  D: "Buruk",
  E: "Sangat Buruk",
};

export default function NutritionScanner({ onAnalyze }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionResult, setNutritionResult] = useState<ReturnType<typeof calculateNutritionScore> | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  
  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        setFile(capturedFile);
        setPreviewUrl(canvas.toDataURL("image/jpeg"));
        setNutritionResult(null);
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  };

  // Retake photo
  const retakePhoto = () => {
    setFile(null);
    setPreviewUrl(null);
    setNutritionResult(null);
    startCamera();
  };

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setNutritionResult(null);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  // Handle upload button click
  function handleUploadClick() {
    inputRef.current?.click();
  }

  // Handle camera button click
  function handleCameraClick() {
    startCamera();
  }

  async function handleAnalyze() {
    if (!file || !previewUrl) return;
    setIsAnalyzing(true);
    
    try {
      // Prepare FormData with image for API
      const formData = new FormData();
      formData.append("image", file);
      
      // Call Gemini API via /api/scan endpoint
      const apiResponse = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error("API Error:", errorData);
        alert(`Analisis gagal: ${errorData.error || "Terjadi kesalahan"}`);
        setIsAnalyzing(false);
        return;
      }

      const apiData = await apiResponse.json();
      const geminiResult = apiData.result;

      // Convert Gemini result to UserNutritionData format
      // Gemini returns: { nutrients: [{name, amount, unit}, ...], nutrition_score, ... }
      const nutritionData: UserNutritionData = {
        userId: "user-1", // Will be from session in production
        date: new Date().toISOString().split("T")[0],
        nutrients: {
          calories: extractNutrient(geminiResult.nutrients, "energy") || 1800,
          protein: extractNutrient(geminiResult.nutrients, "protein") || 50,
          carbohydrates: extractNutrient(geminiResult.nutrients, "carbohydrates") || 300,
          fat: extractNutrient(geminiResult.nutrients, "fat") || 65,
          fiber: extractNutrient(geminiResult.nutrients, "fiber") || 25,
          sugar: extractNutrient(geminiResult.nutrients, "sugar") || 50,
          sodium: extractNutrient(geminiResult.nutrients, "sodium") || 2300,
          cholesterol: extractNutrient(geminiResult.nutrients, "cholesterol") || 300,
          vitaminA: extractNutrient(geminiResult.nutrients, "vitamin a") || 900,
          vitaminC: extractNutrient(geminiResult.nutrients, "vitamin c") || 90,
          vitaminD: extractNutrient(geminiResult.nutrients, "vitamin d") || 20,
          calcium: extractNutrient(geminiResult.nutrients, "calcium") || 1000,
          iron: extractNutrient(geminiResult.nutrients, "iron") || 18,
          potassium: extractNutrient(geminiResult.nutrients, "potassium") || 4700,
        },
      };

      // Calculate nutrition score using the algorithm
      const result = calculateNutritionScore(nutritionData);
      setNutritionResult(result);
      onAnalyze(file, previewUrl);
    } catch (error) {
      console.error("Analisis gagal:", error);
      alert("Gagal menganalisis gambar. Silakan coba lagi.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Helper function to extract nutrient value from Gemini response
  function extractNutrient(nutrients: Array<{ name: string; amount: number }> | undefined, nutrientName: string): number | null {
    if (!Array.isArray(nutrients)) return null;
    
    const found = nutrients.find(n => 
      n.name.toLowerCase().includes(nutrientName.toLowerCase())
    );
    
    return found ? found.amount : null;
  }

  // Render glowing grade display
  function renderGradeDisplay(grade: NutritionGrade) {
    const colors = GRADE_COLORS[grade];
    const label = GRADE_LABELS[grade];
    
    return (
      <div id="scan" className="flex flex-col items-center gap-4">
        <div
          className="relative w-32 h-32 rounded-full flex items-center justify-center font-bold text-6xl"
          style={{
            backgroundColor: colors.bg,
            color: colors.text,
            boxShadow: colors.glow,
          }}
        >
          {grade}
          {/* Pulsing ring animation */}
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ backgroundColor: colors.bg }}
          />
        </div>
        <p className="text-xl font-bold" style={{ color: colors.bg }}>
          {label}
        </p>
        <p className="text-2xl font-bold text-[#1a3129]">
          Score: {nutritionResult?.overallScore}
        </p>
      </div>
    );
  }

  // Render nutrient breakdown
  function renderNutrientBreakdown() {
    if (!nutritionResult) return null;
    
    return (
      <div className="w-full mt-6 space-y-3">
        <h3 className="text-lg font-bold text-[#1a3129] mb-4">Detail Nutrisi</h3>
        {nutritionResult.nutrientBreakdown.slice(0, 8).map((item) => (
          <div key={item.nutrient} className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#262626] capitalize">
              {item.nutrient}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.status === 'good' ? '#00b67a' : item.status === 'high' ? '#ef3f23' : '#ffb800',
                  }}
                />
              </div>
              <span className="text-xs text-[#262626] w-16 text-right">
                {item.actual}/{item.recommended}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edffde] font-sans relative overflow-hidden">
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-[#edffde]/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
          <Loader2 className="w-14 h-14 text-[#1a3129] animate-spin" />
          <p className="text-xl font-bold text-[#1a3129]">Menganalisis nutrisi...</p>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 py-10 md:py-16 flex flex-col gap-10 sm:gap-4">
        
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="inline-block border-b-3 border-[#cbea7b] pb-2 font-bold text-[#1a3129] text-lg sm:text-2xl">
            Scan & Analisis Gizi
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-[#1a3129]">
            Upload Nutrition Facts<br /> Kamu di Sini
          </h1>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 md:gap-8 sm:gap-2">
          
          {/* Left Column - Scan Area */}
          <div className="flex flex-col gap-6 sm:gap-2">
            <div className="p-4 md:p-6 bg-[#FAFDF2] rounded-[24px] md:rounded-[32px] shadow-sm">
              <div
                className={`relative flex flex-col items-center justify-center border-2 border-dotted border-[#1A3129] w-full min-h-[350px] rounded-[16px] transition-all ${
                  isDragging ? "bg-lime-100/50 border-[#3d8a5e]" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="p-4 w-full h-full flex flex-col items-center">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-[300px] rounded-xl object-contain shadow-md" 
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#cbea7b] text-sm font-bold text-black hover:bg-[#b8d96a] transition-all"
                        onClick={(e) => { e.stopPropagation(); retakePhoto(); }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Ambil Ulang
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a3129] text-sm font-bold text-[#cbea7b] hover:bg-[#2d5a45] transition-all"
                        onClick={(e) => { e.stopPropagation(); handleUploadClick(); }}
                      >
                        Upload Lain
                      </button>
                    </div>
                  </div>
                ) : showCamera ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-h-[300px] rounded-xl object-contain"
                    />
                    <div className="flex gap-4 mt-4">
                      <button
                        type="button"
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#ef3f23] text-white font-bold hover:bg-[#d63628] transition-all"
                        onClick={(e) => { e.stopPropagation(); stopCamera(); }}
                      >
                        <X className="w-5 h-5" />
                        Batal
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#1a3129] text-[#cbea7b] font-bold hover:bg-[#2d5a45] transition-all"
                        onClick={(e) => { e.stopPropagation(); capturePhoto(); }}
                      >
                        <Camera className="w-5 h-5" />
                        Ambil Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 px-4 py-10">
                    <div className="p-4 bg-[#cbea7b]/30 rounded-full mb-2">
                      <ArrowUpFromLine className="w-12 h-12 text-[#1a3129] opacity-50" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-[#1a3129]">
                        Upload atau Foto Nutrition Facts Di sini!
                      </h2>
                      <p className="mt-2 text-sm  text-[#262626] opacity-60">
                        Pilih salah satu opsi di bawah ini untuk menambahkan nutrition facts<br />
                        dari produk yang ingin kamu analisis
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full bg-[#cbea7b] px-8  py-3 text-sm  font-bold text-black hover:bg-[#b8d96a] transition-all active:scale-95 "
                        onClick={(e) => { e.stopPropagation(); handleUploadClick(); }}
                      >
                        <ArrowUpFromLine className="w-5 h-5" />
                        Upload Nutrition Facts
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full bg-[#1a3129] px-8  py-3 text-sm  font-bold text-[#cbea7b] hover:bg-[#2d5a45] transition-all active:scale-95 "
                        onClick={(e) => { e.stopPropagation(); handleCameraClick(); }}
                      >
                        <Camera className="w-5 h-5" />
                        Foto Nutrition Facts
                      </button>
                    </div>
                    <div className="absolute mt-4 bottom-2 text-center w-full px-4">
                    <p className="mt-4 text-xs text-[#FB2C36] opacity-60">
                      Pastikan file yang diupload PNG, JPG, WEBP berukuran maks. 10 MB<br />
                    </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analyze Button */}
            <div 
              className={`flex flex-col items-center gap-3 transition-all duration-300 ${
                file ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <button 
                className="flex items-center gap-3 rounded-full bg-[#1a3129] px-10 py-4 text-lg md:text-xl font-bold text-[#cbea7b] hover:bg-[#2d5a45] transition-all shadow-xl active:scale-95"
                onClick={handleAnalyze}
              >
                <Zap className="w-6 h-6 fill-current" />
                Analisis Sekarang
              </button>
              <span className="text-xs md:text-sm text-[#262626] opacity-50 font-medium">
                Proses biasanya selesai dalam 2–5 detik
              </span>
            </div>
          </div>

          {/* Right Column - Results Area */}
          <div className="flex flex-col gap-6">
            <div className="p-6 md:p-8 bg-[#FAFDF2] rounded-[24px] md:rounded-[32px] shadow-sm min-h-[400px]">
              {nutritionResult ? (
                <div className="flex flex-col items-center">
                  {/* Glowing Grade Display */}
                  {renderGradeDisplay(nutritionResult.grade)}
                  
                  {/* Nutrient Breakdown */}
                  {renderNutrientBreakdown()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <div className="p-4 bg-[#cbea7b]/30 rounded-full mb-4">
                    <Zap className="w-12 h-12 text-[#1a3129] opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a3129] mb-2">
                    Hasil Analisis
                  </h3>
                  <p className="text-sm text-[#262626] opacity-60 max-w-xs">
                    Upload dan analisis foto Nutrition Facts untuk melihat hasil NutriScore
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Hidden file input for upload */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <div>
        <Footer />
    </div>
    </div>
    
  );
}