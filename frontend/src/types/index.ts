export interface ItemDetection {
  label: string;
  confidence: number;
  bin?: string; // Disposal bin (if refined by Gemini)
  explanation?: string; // Explanation (if refined by Gemini)
}

export interface InferResponse {
  items: ItemDetection[];
  zip?: string;
}

export interface ItemDecision {
  label: string;
  bin: "recycling" | "compost" | "trash";
  explanation: string;
  eco_tip: string;
}

export interface ExplainResponse {
  decisions: ItemDecision[];
}

export interface SortEvent {
  id: number;
  user_id?: string;
  zip?: string;
  items_json: string[];
  decision: string;
  co2e_saved: number;
  created_at: string;
}

export interface ChatbotRequest {
  decisions: ItemDecision[];
  voice_personality?: "friendly" | "enthusiastic" | "educational";
  include_eco_tips?: boolean;
}

export interface ChatbotResponse {
  audio_url?: string;
  conversational_text: string;
  fallback_text: string;
  voice_personality: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  avatar?: AvatarConfig; // New field
}

export interface AvatarConfig {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  voice_personality: string;
  avatar_url: string;
  animation_styles: {
    idle: string;
    speaking: string;
    listening: string;
  };
  personality_traits: string[];
  color_theme: string;
}

export interface AvatarState {
  current_avatar: AvatarConfig;
  is_speaking: boolean;
  is_listening: boolean;
  animation_phase: "idle" | "speaking" | "listening";
}

export interface VoicePersonality {
  personality_id: string;
  voice_id: string;
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  avatar: {
    name: string;
    gender: string;
    description: string;
    personality_traits: string[];
    color_theme: string;
  };
}

export interface AvatarConfiguration {
  personality_id: string;
  voice_id: string;
  avatar: {
    name: string;
    gender: string;
    description: string;
    personality_traits: string[];
    color_theme: string;
  };
}
