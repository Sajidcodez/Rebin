"use client"

import { useState, useEffect } from "react"
import { Icons } from "../ui/icons"
import { ItemDetection } from "../../types"

interface ScanInfoPanelProps {
  isScanning: boolean
  detectionResults?: ItemDetection[]
}

export function ScanInfoPanel({ isScanning, detectionResults = [] }: ScanInfoPanelProps) {

  return (
    <div className="h-full bg-black border border-gray-800 rounded-lg overflow-hidden flex flex-col min-h-[400px] lg:min-h-[600px]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Icons.sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">Live Detection</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {detectionResults.length > 0 ? `${detectionResults.length} items detected` : "Waiting for results..."}
            </p>
          </div>
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
          detectionResults.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base capitalize">
                    {item.label}
                  </h3>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-primary">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
