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

  // Delete a specific confirmed item
  const handleDeleteItem = (item: ItemDetection) => {
    console.log("[Page] Deleting item:", item)
    setConfirmedItems(prev => 
      prev.filter(confirmed => 
        !(confirmed.label === item.label && 
          Math.abs(confirmed.confidence - item.confidence) < 0.01)
      )
    )
    setAllDisplayItems(prev => 
      prev.filter(existing => 
        !(existing.label === item.label && 
          Math.abs(existing.confidence - item.confidence) < 0.01)
      )
    )
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
        {/* Show loading/results fullscreen when analyzing */}
        {isAnalyzing || analysisResult ? (
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            {isAnalyzing ? (
              // Loading State - Fullscreen
              <div className="w-full max-w-2xl text-center space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                    <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white">
                    Analyzing with AI...
                  </h2>
                  <p className="text-lg text-gray-400">
                    Our AI is determining the best disposal method for your {confirmedItems.length} item{confirmedItems.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex justify-center gap-2 pt-4">
                    <div className="h-3 w-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-3 w-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-3 w-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            ) : (
              // Results State - Fullscreen
              <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                    Analysis Complete! ✨
                  </h2>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-96">
                      {JSON.stringify(analysisResult, null, 2)}
                    </pre>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setAnalysisResult(null)}
                      className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition"
                    >
                      Scan Another Item
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 border border-gray-600 hover:bg-gray-800 text-white font-semibold rounded-lg transition"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Normal State - Show webcam + detection panel
          <div className="flex flex-col lg:flex-row gap-6 max-w-full h-[calc(100vh-12rem)]">
            {/* Webcam Scanner - 70% on desktop */}
            <div className="w-full lg:w-[70%] flex-shrink-0 flex-grow-0 min-w-0 h-full">
              <WebcamScanner
                isScanning={isScanning}
                setIsScanning={handleScanningChange}
                onImageUpload={handleImageUpload}
                onDetectionResults={handleDetectionResults}
              />
            </div>

            {/* Info Panel - 30% on desktop */}
            <div className="w-full lg:w-[30%] flex-shrink-0 flex-grow-0 min-w-0 h-full">
              <ScanInfoPanel 
                isScanning={isScanning}
                detectionResults={allDisplayItems}
                confirmedItems={confirmedItems}
                onConfirmItem={handleConfirmItem}
                onDeleteItem={handleDeleteItem}
                onReset={handleReset}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                analysisResult={analysisResult}
              />
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
