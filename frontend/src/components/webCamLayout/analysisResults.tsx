"use client"

import { useState, useEffect } from "react"
import { Icons } from "../ui/icons"
import { ItemDecision } from "../../types"

interface AnalysisResultsProps {
  results: any
  confirmedItems: any[]
  selectedPersonality: "friendly" | "enthusiastic" | "educational"
  onScanAnother: () => void
  onReset: () => void
}

type DisposalAction = "recycled" | "trashed" | "composted" | "skipped" | null

const PERSONALITIES = {
  friendly: {
    name: "Green Gary",
    image: "/avatars/green-gary.png",
    description: "Friendly & Approachable",
    style: "Makes recycling feel easy",
    color: "#4CAF50"
  },
  enthusiastic: {
    name: "Eco Emma",
    image: "/avatars/eco-emma.png",
    description: "Energetic & Passionate",
    style: "Gets excited about sustainability",
    color: "#FF9800"
  },
  educational: {
    name: "Professor Pete",
    image: "/avatars/professor-pete.png",
    description: "Knowledgeable & Clear",
    style: "Provides informative guidance",
    color: "#2196F3"
  },
}

export function AnalysisResults({ results, selectedPersonality, onScanAnother, onReset }: AnalysisResultsProps) {
  // selectedPersonality now comes from props (what was sent to Gemini)
  // Track disposal actions for each item (index-based)
  const [disposalActions, setDisposalActions] = useState<Record<number, DisposalAction>>({})
  
  // Track which item is currently playing audio
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  // Gemini now handles personality formatting, so we just display the explanation directly

  // Handle disposal action selection
  const handleDisposalAction = (index: number, action: DisposalAction) => {
    setDisposalActions(prev => ({
      ...prev,
      [index]: action
    }))
    
    // TODO: Send to backend/partner's API
    console.log(`[AnalysisResults] Item ${index} disposed as:`, action)
  }

  // Handle voice playback for a single item
  const handlePlayVoice = async (index: number, decision: ItemDecision) => {
    // Stop any currently playing audio
    if (audioElement) {
      audioElement.pause()
      audioElement.src = ""
      setPlayingIndex(null)
    }

    // If clicking the same item, just stop
    if (playingIndex === index) {
      setAudioElement(null)
      return
    }

    try {
      setPlayingIndex(index)
      console.log(`[AnalysisResults] Playing voice for item ${index}:`, decision.label)

      // Import API client
      const { apiClient } = await import("../../lib/api")
      
      // Create a single-item decision array for TTS
      const response = await apiClient.speakDecisions(
        [decision],
        {
          voice_personality: selectedPersonality,
          include_eco_tips: true,
        }
      )

      if (response.audio_url) {
        // Create and play audio element
        const audio = new Audio(response.audio_url)
        setAudioElement(audio)
        
        audio.onended = () => {
          setPlayingIndex(null)
          setAudioElement(null)
        }
        
        audio.onerror = () => {
          console.error("[AnalysisResults] Audio playback failed")
          setPlayingIndex(null)
          setAudioElement(null)
        }
        
        await audio.play()
      } else {
        console.warn("[AnalysisResults] No audio URL returned")
        setPlayingIndex(null)
      }
    } catch (error) {
      console.error("[AnalysisResults] Failed to play voice:", error)
      setPlayingIndex(null)
      setAudioElement(null)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
      }
    }
  }, [audioElement])

  const getBinColor = (bin: string) => {
    switch (bin.toLowerCase()) {
      case "recycling":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "compost":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "trash":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
      default:
        return "bg-primary/20 text-primary border-primary/50"
    }
  }

  const getBinIcon = (bin: string) => {
    switch (bin.toLowerCase()) {
      case "recycling":
        return Icons.recycle
      case "compost":
        return Icons.leaf
      case "trash":
        return Icons.trash
      default:
        return Icons.package
    }
  }

  // Parse results
  const decisions: ItemDecision[] = results?.decisions || []
  
  // Calculate logged items count
  const loggedCount = Object.values(disposalActions).filter(action => action && action !== "skipped").length
  const totalCount = decisions.length

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header showing which personality was used */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Analysis Complete! ✨
        </h2>
        <div className="flex items-center justify-between mt-2">
          <p className="text-gray-400">
            Analyzed by <span className="text-primary font-semibold">{PERSONALITIES[selectedPersonality].name}</span>
          </p>
          {totalCount > 0 && (
            <p className="text-sm text-gray-400">
              📊 Logged: <span className="text-primary font-semibold">{loggedCount}/{totalCount}</span> items
            </p>
          )}
        </div>
      </div>

      {/* Results Cards - Scrollable */}
      <div className="space-y-4 mb-8">
        {decisions.map((decision, index) => {
          const BinIcon = getBinIcon(decision.bin)
          const userAction = disposalActions[index]
          
          return (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 animate-in fade-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Item Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full ${getBinColor(decision.bin)} border-2 flex items-center justify-center`}>
                    <BinIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white capitalize">{decision.label}</h3>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full border ${getBinColor(decision.bin)}`}>
                      {decision.bin}
                    </span>
                  </div>
                </div>
                {/* Voice Play Button */}
                <button 
                  onClick={() => handlePlayVoice(index, decision)}
                  disabled={playingIndex !== null && playingIndex !== index}
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition ${
                    playingIndex === index
                      ? "bg-primary text-white animate-pulse"
                      : "bg-primary/20 hover:bg-primary/30 text-primary"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={playingIndex === index ? "Stop" : "Play voice"}
                >
                  {playingIndex === index ? (
                    <Icons.volume className="h-5 w-5 animate-pulse" />
                  ) : (
                    <Icons.volume className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Explanation from Gemini (already formatted by personality) */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
                <p className="text-gray-300 leading-relaxed">{decision.explanation}</p>
                {decision.eco_tip && (
                  <div className="pt-2 mt-2 border-t border-gray-700">
                    <p className="text-sm text-primary font-medium">💡 Eco Tip:</p>
                    <p className="text-sm text-gray-400 mt-1">{decision.eco_tip}</p>
                  </div>
                )}
              </div>

              {/* Disposal Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                {!userAction ? (
                  // Show action buttons if not logged yet
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-300">
                      ✅ Did you dispose of this item?
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => handleDisposalAction(index, "recycled")}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 transition"
                      >
                        <Icons.recycle className="h-5 w-5 text-blue-400" />
                        <span className="text-xs text-blue-300 font-medium">Recycled</span>
                      </button>
                      <button
                        onClick={() => handleDisposalAction(index, "trashed")}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-gray-500/50 bg-gray-500/10 hover:bg-gray-500/20 transition"
                      >
                        <Icons.trash className="h-5 w-5 text-gray-400" />
                        <span className="text-xs text-gray-300 font-medium">Trashed</span>
                      </button>
                      <button
                        onClick={() => handleDisposalAction(index, "composted")}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-green-500/50 bg-green-500/10 hover:bg-green-500/20 transition"
                      >
                        <Icons.leaf className="h-5 w-5 text-green-400" />
                        <span className="text-xs text-green-300 font-medium">Composted</span>
                      </button>
                      <button
                        onClick={() => handleDisposalAction(index, "skipped")}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-gray-700 bg-gray-800 hover:bg-gray-700 transition"
                      >
                        <Icons.x className="h-5 w-5 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium">Skip</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Show confirmation after logging
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2">
                      {userAction === "recycled" && <Icons.recycle className="h-5 w-5 text-blue-400" />}
                      {userAction === "trashed" && <Icons.trash className="h-5 w-5 text-gray-400" />}
                      {userAction === "composted" && <Icons.leaf className="h-5 w-5 text-green-400" />}
                      {userAction === "skipped" && <Icons.x className="h-5 w-5 text-gray-400" />}
                      <p className="text-sm font-medium text-white">
                        {userAction === "recycled" && "✅ Logged as Recycled"}
                        {userAction === "trashed" && "✅ Logged as Trashed"}
                        {userAction === "composted" && "✅ Logged as Composted"}
                        {userAction === "skipped" && "⏭️ Skipped"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDisposalAction(index, null)}
                      className="text-xs text-gray-400 hover:text-white transition"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Personality Label */}
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <Icons.sparkles className="h-3 w-3" />
                <span>Voiced by {PERSONALITIES[selectedPersonality].name}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons - Sticky at bottom */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onScanAnother}
          className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition"
        >
          Scan Another Item
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 border border-gray-600 hover:bg-gray-800 text-white font-semibold rounded-lg transition"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}

