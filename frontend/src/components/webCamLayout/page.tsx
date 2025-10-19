'use client'

import { useState } from "react";
import { Header } from "../landingPage/header";
import { Footer } from "../landingPage/footer";
import { WebcamScanner } from "./webcamScanner"
import { ScanInfoPanel } from "./scaninfoPanel"
import { AnalysisResults } from "./analysisResults"
import { ItemDetection } from "../../types"

export default function SortingPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [confirmedItems, setConfirmedItems] = useState<ItemDetection[]>([]) // Confirmed items for Gemini
  const [allDisplayItems, setAllDisplayItems] = useState<ItemDetection[]>([]) // Combined list for display
  const [isAnalyzing, setIsAnalyzing] = useState(false) // Loading state for Gemini
  const [analysisResult, setAnalysisResult] = useState<any>(null) // Gemini response
  const [selectedPersonality, setSelectedPersonality] = useState<"friendly" | "enthusiastic" | "educational">("friendly") // Voice personality

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
    
    if (!isScanning) {
      // If not scanning, ignore new detections
      return
    }
    
    // Step 1: Remove duplicates from the incoming results (keep highest confidence)
    const uniqueResults = results.reduce((acc, result) => {
      const existing = acc.find(item => item.label === result.label)
      if (!existing) {
        acc.push(result)
      } else if (result.confidence > existing.confidence) {
        // Replace with higher confidence detection
        acc[acc.indexOf(existing)] = result
      }
      return acc
    }, [] as ItemDetection[])
    
    // Step 2: Filter out already confirmed items
    const newDetections = uniqueResults.filter(result => {
      return !confirmedItems.some(confirmed => confirmed.label === result.label)
    })
    
    console.log("[Page] Unique detections after filtering:", newDetections.map(d => d.label))
    
    // Step 3: Combine confirmed items + new unique detections
    setAllDisplayItems([...confirmedItems, ...newDetections])
  }

  // Confirm an item (add to confirmed list)
  const handleConfirmItem = (item: ItemDetection) => {
    console.log("[Page] Item confirmed:", item)
    
    // Check if already confirmed (by label only - no duplicates)
    const isDuplicate = confirmedItems.some(confirmed => confirmed.label === item.label)
    
    if (isDuplicate) {
      console.warn("[Page] Item already confirmed, ignoring:", item.label)
      return
    }
    
    // Add to confirmed items
    setConfirmedItems(prev => [...prev, item])
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
    console.log("[Page] Deleting item:", item.label)
    
    // Remove from confirmed items by label
    setConfirmedItems(prev => prev.filter(confirmed => confirmed.label !== item.label))
    
    // Remove from display items by label
    setAllDisplayItems(prev => prev.filter(existing => existing.label !== item.label))
  }

  // Send confirmed items to Gemini for analysis
  const handleAnalyze = async (personality: "friendly" | "enthusiastic" | "educational") => {
    if (confirmedItems.length === 0) return
    
    setSelectedPersonality(personality)
    console.log("[Page] Sending to Gemini with personality:", personality, confirmedItems)
    setIsAnalyzing(true)
    setAnalysisResult(null)
    
    try {
      // Import apiClient dynamically to avoid issues
      const { apiClient } = await import("../../lib/api")
      const response = await apiClient.explain(confirmedItems, undefined, undefined, personality)
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
          <div className="h-[calc(100vh-12rem)] overflow-y-auto">
            {isAnalyzing ? (
              // Loading State - Fullscreen (centered)
              <div className="flex items-center justify-center h-full">
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
              </div>
            ) : (
              // Results State - Scrollable with buttons always visible
              <div className="flex items-start justify-center py-8">
                <AnalysisResults
                  results={analysisResult}
                  confirmedItems={confirmedItems}
                  selectedPersonality={selectedPersonality}
                  onScanAnother={() => setAnalysisResult(null)}
                  onReset={handleReset}
                />
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
