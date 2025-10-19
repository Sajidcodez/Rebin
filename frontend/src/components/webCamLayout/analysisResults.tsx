"use client"

import { Icons } from "../ui/icons"
import { ItemDecision } from "../../types"

interface AnalysisResultsProps {
  results: any
  confirmedItems: any[]
  selectedPersonality: "friendly" | "enthusiastic" | "educational"
  onScanAnother: () => void
  onReset: () => void
}

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

  // Gemini now handles personality formatting, so we just display the explanation directly

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

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header showing which personality was used */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Analysis Complete! ✨
        </h2>
        <p className="text-gray-400 mt-2">
          Analyzed by <span className="text-primary font-semibold">{PERSONALITIES[selectedPersonality].name}</span>
        </p>
      </div>

      {/* Results Cards - Scrollable */}
      <div className="space-y-4 mb-8">
        {decisions.map((decision, index) => {
          const BinIcon = getBinIcon(decision.bin)
          
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
                <button className="h-10 w-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition">
                  <Icons.volume className="h-5 w-5 text-primary" />
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

