"use client"

import { useState, useEffect, useRef } from "react"
import { Icons } from "../ui/icons"
import { ItemDetection } from "../../types"
import { Button } from "../ui/button"

interface ScanInfoPanelProps {
  isScanning: boolean
  detectionResults?: ItemDetection[]
  confirmedItems?: ItemDetection[]
  onConfirmItem?: (item: ItemDetection) => void
  onDeleteItem?: (item: ItemDetection) => void
  onReset?: () => void
  onAnalyze?: () => void
  isAnalyzing?: boolean
  analysisResult?: any
}

export function ScanInfoPanel({ 
  isScanning, 
  detectionResults = [], 
  confirmedItems = [],
  onConfirmItem,
  onDeleteItem,
  onReset,
  onAnalyze,
  isAnalyzing = false,
  analysisResult
}: ScanInfoPanelProps) {
  const loadingRef = useRef<HTMLDivElement>(null)
  
  // Check if an item is already confirmed
  const isItemConfirmed = (item: ItemDetection) => {
    return confirmedItems.some(
      confirmed => confirmed.label === item.label && 
      Math.abs(confirmed.confidence - item.confidence) < 0.01
    )
  }
  
  // Show reset button when scanning is stopped and there are confirmed items
  const showResetButton = !isScanning && confirmedItems.length > 0
  
  // Show analyze button when not scanning, have confirmed items, and not currently analyzing
  const showAnalyzeButton = !isScanning && confirmedItems.length > 0 && !analysisResult
  
  // Smooth scroll to loading section when analyzing starts
  useEffect(() => {
    if (isAnalyzing && loadingRef.current) {
      loadingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isAnalyzing])

  return (
    <div className="h-full bg-black border border-gray-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Icons.sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">
                {isScanning ? "Live Detection" : "Confirmed Items"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                {isScanning 
                  ? (detectionResults.length > 0 ? `${detectionResults.length} items detected` : "Waiting for results...")
                  : `${confirmedItems.length} item${confirmedItems.length !== 1 ? 's' : ''} ready for analysis`
                }
              </p>
            </div>
          </div>
          {/* Reset button - only show when stopped and have confirmed items */}
          {showResetButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
            >
              <Icons.x className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {detectionResults.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4 sm:p-8">
            <div className="space-y-3">
              <div className="h-12 sm:h-16 w-12 sm:w-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                <Icons.sparkles className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">No Detection Yet</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {isScanning ? "Analyzing... (updates every 5s)" : "Start scanning to see real-time detection"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          detectionResults.map((item, index) => {
            const confirmed = isItemConfirmed(item)
            const hasGeminiRefinement = item.bin || item.explanation
            
            return (
              <div
                key={`${item.label}-${index}`}
                onClick={() => !confirmed && !isScanning && onConfirmItem?.(item)}
                className={`rounded-lg p-3 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-300 transition-all ${
                  confirmed 
                    ? 'bg-primary/10 border-2 border-primary cursor-default' 
                    : 'bg-gray-800 border-2 border-gray-700 cursor-pointer hover:border-primary/50 hover:bg-gray-700 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base capitalize">
                        {item.label}
                      </h3>
                      {hasGeminiRefinement && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          ✨ AI
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs sm:text-sm font-medium text-primary">
                        {Math.round(item.confidence * 100)}%
                      </span>
                      {item.bin && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                          → {item.bin}
                        </span>
                      )}
                    </div>
                    {item.explanation && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                        {item.explanation}
                      </p>
                    )}
                  </div>
                  {confirmed && (
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {/* Delete button - only show when scanning is stopped */}
                      {!isScanning && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteItem?.(item)
                          }}
                          className="h-8 w-8 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition"
                        >
                          <Icons.x className="h-4 w-4 text-red-400" />
                        </button>
                      )}
                      {/* Checkmark */}
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Icons.check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        
        {/* Analyze Button - appears after detections list when stopped */}
        {showAnalyzeButton && (
          <div className="p-4">
            <Button
              onClick={onAnalyze}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
              disabled={isAnalyzing}
            >
              <Icons.sparkles className="h-5 w-5 mr-2" />
              Analyze with AI
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
