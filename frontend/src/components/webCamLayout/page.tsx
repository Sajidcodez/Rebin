'use client'

import { useState } from "react";
import { Header } from "../landingPage/header";
import { Footer } from "../landingPage/footer";
import { WebcamScanner } from "./webcamScanner"
import { ScanInfoPanel } from "./scaninfoPanel"
import { ItemDetection } from "../../types"

export default function SortingPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ItemDetection[]>([])

  const handleImageUpload = (imageData: string) => {
    console.log("[Page] Image uploaded, sending to backend:", imageData.substring(0, 50))
  }

  const handleScanningChange = (scanning: boolean) => {
    setIsScanning(scanning)
    if (!scanning) {
      setScanResults([])
    }
  }

  const handleDetectionResults = (results: ItemDetection[]) => {
    console.log("[Page] Received detection results:", results)
    setScanResults(results)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 max-w-full min-h-[600px]">
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
          <div className="w-full lg:w-[30%] flex-shrink-0 flex-grow-0 min-w-0 overflow-auto">
            <ScanInfoPanel 
              isScanning={isScanning}
              detectionResults={scanResults}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
