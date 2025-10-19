'use client'

import { useState } from "react";
import { apiClient } from "../../lib/api";
import { ResultCard } from "../ResultCard";
import { ChatbotInterface } from "../ChatbotInterface";
import type { ItemDecision } from "../../types";
import { Header } from "../landingPage/header";
import { Footer } from "../landingPage/footer";
import { WebcamScanner } from "./webcamScanner"
import { ScanInfoPanel } from "./scanInfoPanel"

export default function SortingPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ItemDecision[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChatbotAll, setShowChatbotAll] = useState(false)

  const dataUrlToFile = async (dataUrl: string, filename = "capture.jpg"): Promise<File> => {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], filename, { type: blob.type || "image/jpeg" })
    return file
  }

  const handleImageUpload = async (imageData: string) => {
    try {
      setIsLoading(true)
      setError(null)
      // Convert data URL to File for backend
      const file = await dataUrlToFile(imageData)

      // 1) Infer (YOLO)
      const infer = await apiClient.infer(file)

      // 2) Explain (OpenRouter/Gemini)
      const explain = await apiClient.explain(
        infer.items.map((i) => ({ label: i.label }))
      )

      setScanResults(explain.decisions)
    } catch (e: any) {
      console.error(e)
      setError("Failed to analyze image. Please try again.")
      setScanResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleScanningChange = (scanning: boolean) => {
    setIsScanning(scanning)
    if (!scanning) {
      // Clear results when stopping
      setScanResults([])
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Webcam Scanner - 70% on desktop */}
          <div className="w-full lg:w-[70%]">
            <WebcamScanner
              isScanning={isScanning}
              setIsScanning={handleScanningChange}
              onImageUpload={handleImageUpload}
            />
          </div>

          {/* Info Panel - 30% on desktop */}
          <div className="w-full lg:w-[30%]">
            <ScanInfoPanel isScanning={isScanning} />

            {/* Status / Errors */}
            <div className="mt-4 space-y-3">
              {isLoading && (
                <div className="text-sm text-blue-400">Analyzing image…</div>
              )}
              {error && (
                <div className="text-sm text-red-400">{error}</div>
              )}
            </div>

            {/* Results */}
            {scanResults.length > 0 && (
              <div className="mt-6 space-y-4">
                {scanResults.map((decision, idx) => (
                  <ResultCard key={idx} decision={decision} />
                ))}

                {/* Listen to all decisions */}
                <button
                  onClick={() => setShowChatbotAll(true)}
                  className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-md"
                >
                  🎤 Listen to All
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Chatbot for all decisions */}
      {showChatbotAll && scanResults.length > 0 && (
        <ChatbotInterface
          decisions={scanResults}
          onClose={() => setShowChatbotAll(false)}
        />
      )}
    </div>
  )
}
