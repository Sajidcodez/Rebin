'use client'

import { useState } from "react";
import { Header } from "../landingPage/header";
import { Footer } from "../landingPage/footer";
import { WebcamScanner } from "./webcamScanner"
import { ScanInfoPanel } from "./scaninfoPanel"
import { ItemDetection } from "../../types"

export default function SortingPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [confirmedItems, setConfirmedItems] = useState<ItemDetection[]>([]) // Confirmed items for Gemini
  const [allDisplayItems, setAllDisplayItems] = useState<ItemDetection[]>([]) // Combined list for display
  const [isAnalyzing, setIsAnalyzing] = useState(false) // Loading state for Gemini
  const [analysisResult, setAnalysisResult] = useState<any>(null) // Gemini response

  const handleImageUpload = (imageData: string) => {
    console.log("[Page] Image uploaded, sending to backend:", imageData.substring(0, 50))
  }

  const handleScanningChange = (scanning: boolean) => {
    setIsScanning(scanning)
    if (!scanning) {
      setAllDisplayItems(confirmedItems) // Keep only confirmed items when stopped
    }
  }

  const handleDetectionResults = (results: ItemDetection[]) => {
    console.log("[Page] Received detection results:", results)
    
    // Merge: confirmed items + new live detections (avoid duplicates)
    const combined = [...confirmedItems]
    results.forEach(result => {
      const alreadyConfirmed = confirmedItems.some(
        confirmed => confirmed.label === result.label && 
        Math.abs(confirmed.confidence - result.confidence) < 0.01
      )
      if (!alreadyConfirmed) {
        combined.push(result)
      }
    })
    setAllDisplayItems(combined)
  }

  // Store confirmed item for Gemini processing and keep in display
  const handleConfirmItem = (item: ItemDetection) => {
    console.log("[Page] Item confirmed for Gemini:", item)
    setConfirmedItems(prev => [...prev, item])
    
    // Update display list to reflect confirmed status
    setAllDisplayItems(prev => {
      const exists = prev.some(
        existing => existing.label === item.label && 
        Math.abs(existing.confidence - item.confidence) < 0.01
      )
      return exists ? prev : [...prev, item]
    })
  }

  // Reset all confirmed items
  const handleReset = () => {
    console.log("[Page] Resetting all confirmed items")
    setConfirmedItems([])
    setAllDisplayItems([])
    setAnalysisResult(null)
  }

  // Send confirmed items to Gemini for analysis
  const handleAnalyze = async () => {
    if (confirmedItems.length === 0) return
    
    console.log("[Page] Sending to Gemini:", confirmedItems)
    setIsAnalyzing(true)
    setAnalysisResult(null)
    
    try {
      // Import apiClient dynamically to avoid issues
      const { apiClient } = await import("../../lib/api")
      const response = await apiClient.explain(confirmedItems)
      console.log("[Page] Gemini response:", response)
      setAnalysisResult(response)
    } catch (error) {
      console.error("[Page] Analysis failed:", error)
      setAnalysisResult({ error: "Failed to analyze items" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 max-w-full h-[calc(100vh-12rem)]">
          {/* Webcam Scanner - 70% on desktop, fixed width prevents expansion */}
          <div className="w-full lg:w-[70%] flex-shrink-0 flex-grow-0 min-w-0 h-full">
            <WebcamScanner
              isScanning={isScanning}
              setIsScanning={handleScanningChange}
              onImageUpload={handleImageUpload}
              onDetectionResults={handleDetectionResults}
            />
          </div>

          {/* Info Panel - 30% on desktop, can scroll if content overflows */}
          <div className="w-full lg:w-[30%] flex-shrink-0 flex-grow-0 min-w-0 h-full">
            <ScanInfoPanel 
              isScanning={isScanning}
              detectionResults={allDisplayItems}
              confirmedItems={confirmedItems}
              onConfirmItem={handleConfirmItem}
              onReset={handleReset}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              analysisResult={analysisResult}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
