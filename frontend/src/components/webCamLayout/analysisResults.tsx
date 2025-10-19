"use client"

import { useState } from "react"
import { Icons } from "../ui/icons"
import { ItemDecision } from "../../types"

interface AnalysisResultsProps {
  results: any
  confirmedItems: any[]
  onScanAnother: () => void
  onReset: () => void
}

type VoicePersonality = "man" | "woman" | "professor"

const PERSONALITIES = {
  man: {
    name: "Alex",
    icon: Icons.user,
    description: "Concise & Direct",
    style: "Quick facts, no fluff",
  },
  woman: {
    name: "Emma",
    icon: Icons.users,
    description: "Friendly & Helpful",
    style: "Warm tips and encouragement",
  },
  professor: {
    name: "Dr. Chen",
    icon: Icons.sparkles,
    description: "Detailed & Educational",
    style: "In-depth explanations",
  },
}

export function AnalysisResults({ results, confirmedItems, onScanAnother, onReset }: AnalysisResultsProps) {
  const [selectedPersonality, setSelectedPersonality] = useState<VoicePersonality>("man")

  // Format the response based on personality
  const formatResponse = (decision: ItemDecision, personality: VoicePersonality): string => {
    const { label, bin, explanation, eco_tip } = decision

    switch (personality) {
      case "man":
        // Concise: "Recycle. Aluminum can. Rinse and crush if your city allows."
        return `${bin.charAt(0).toUpperCase() + bin.slice(1)}. ${label}. ${explanation.split('.')[0]}.`
      
      case "woman":
        // Friendly: "That belongs in recycling—it's an aluminum can. Quick tip: a quick rinse keeps bins clean!"
        return `That belongs in ${bin}—it's ${label.startsWith('a') || label.startsWith('e') || label.startsWith('i') || label.startsWith('o') || label.startsWith('u') ? 'an' : 'a'} ${label}. Quick tip: ${eco_tip}`
      
      case "professor":
        // Didactic: "Recycle. The cylindrical pull-tab and printed aluminum indicate a can. Most municipalities accept aluminum curbside."
        return `${bin.charAt(0).toUpperCase() + bin.slice(1)}. ${explanation} ${eco_tip}`
      
      default:
        return explanation
    }
  }

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
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Voice Personality Selector */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Choose Voice Style</h3>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(PERSONALITIES) as VoicePersonality[]).map((personality) => {
            const p = PERSONALITIES[personality]
            const Icon = p.icon
            const isSelected = selectedPersonality === personality
            
            return (
              <button
                key={personality}
                onClick={() => setSelectedPersonality(personality)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "bg-primary/20 border-primary"
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                <div className="text-center">
                  <div className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-white"}`}>
                    {p.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{p.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Cards */}
      <div className="space-y-4">
        {decisions.map((decision, index) => {
          const BinIcon = getBinIcon(decision.bin)
          const formattedText = formatResponse(decision, selectedPersonality)
          
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

              {/* Formatted Response */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-300 leading-relaxed">{formattedText}</p>
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

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
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

