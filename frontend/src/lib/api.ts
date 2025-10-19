import axios from "axios";
import {
  InferResponse,
  ExplainResponse,
  ItemDecision,
  ChatbotRequest,
  ChatbotResponse,
  VoicePersonality,
  AvatarConfiguration,
  AvatarConfig,
} from "../types";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const apiClient = {
  async infer(file: File, zip?: string): Promise<InferResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (zip) {
      formData.append("zip", zip);
    }

    const response = await api.post("/infer", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async explain(
    items: { label: string }[],
    zip?: string,
    policies?: any
  ): Promise<ExplainResponse> {
    const response = await api.post("/explain", {
      items,
      zip,
      policies_json: policies,
    });
    return response.data;
  },

  async logEvent(event: {
    user_id?: string;
    zip?: string;
    items_json: string[];
    decision: string;
    co2e_saved: number;
  }): Promise<{ id: number }> {
    const response = await api.post("/event", event);
    return response.data;
  },

  async speakDecisions(
    decisions: ItemDecision[],
    options?: {
      voice_personality?: "friendly" | "enthusiastic" | "educational";
      include_eco_tips?: boolean;
    }
  ): Promise<ChatbotResponse> {
    const request: ChatbotRequest = {
      decisions,
      voice_personality: options?.voice_personality || "friendly",
      include_eco_tips: options?.include_eco_tips !== false,
    };
    const response = await api.post("/chatbot/speak", request);
    return response.data;
  },

  async getAvailableVoices(): Promise<{ voices: VoicePersonality[] }> {
    const response = await api.get("/chatbot/voices");
    return response.data;
  },

  async getAvailableAvatars(): Promise<{ avatars: AvatarConfiguration[] }> {
    const response = await api.get("/chatbot/avatars");
    return response.data;
  },

  /**
   * Converts backend avatar configuration to frontend avatar config
   */
  convertAvatarConfig(backendConfig: AvatarConfiguration): AvatarConfig {
    return {
      id: backendConfig.personality_id,
      name: backendConfig.avatar.name,
      description: backendConfig.avatar.description,
      gender: backendConfig.avatar.gender as "male" | "female" | "neutral",
      voice_personality: backendConfig.personality_id,
      avatar_url: this.getAvatarImageUrl(backendConfig.personality_id),
      personality_traits: backendConfig.avatar.personality_traits,
      color_theme: backendConfig.avatar.color_theme,
      animation_styles: {
        idle: "animate-pulse",
        speaking: "animate-pulse scale-105",
        listening: "animate-bounce",
      },
    };
  },

  /**
   * Gets the appropriate avatar image URL based on personality ID
   */
  getAvatarImageUrl(personalityId: string): string {
    const avatarMap: { [key: string]: string } = {
      friendly: "/avatars/green-gary.png",
      enthusiastic: "/avatars/eco-emma.png",
      educational: "/avatars/professor-pete.png",
    };

    return avatarMap[personalityId] || avatarMap.friendly;
  },

  /**
   * Fetches and converts avatar configurations for easy use in components
   */
  async getAvatarConfigs(): Promise<AvatarConfig[]> {
    try {
      const response = await this.getAvailableAvatars();
      return response.avatars.map((config) => this.convertAvatarConfig(config));
    } catch (error) {
      console.error("Failed to fetch avatar configurations:", error);
      // Return fallback configurations
      return this.getFallbackAvatarConfigs();
    }
  },

  /**
   * Returns fallback avatar configurations when API fails
   */
  getFallbackAvatarConfigs(): AvatarConfig[] {
    return [
      {
        id: "friendly",
        name: "Green Gary",
        description:
          "A friendly, approachable guide who makes recycling feel easy and natural",
        gender: "male",
        voice_personality: "friendly",
        avatar_url: "/avatars/green-gary.png",
        personality_traits: ["encouraging", "patient", "warm", "supportive"],
        color_theme: "#4CAF50",
        animation_styles: {
          idle: "animate-pulse",
          speaking: "animate-pulse scale-105",
          listening: "animate-bounce",
        },
      },
      {
        id: "enthusiastic",
        name: "Eco Emma",
        description:
          "An energetic environmental enthusiast who gets excited about sustainable practices",
        gender: "female",
        voice_personality: "enthusiastic",
        avatar_url: "/avatars/eco-emma.png",
        personality_traits: [
          "energetic",
          "passionate",
          "motivating",
          "inspiring",
        ],
        color_theme: "#FF9800",
        animation_styles: {
          idle: "animate-pulse",
          speaking: "animate-pulse scale-105",
          listening: "animate-bounce",
        },
      },
      {
        id: "educational",
        name: "Professor Pete",
        description:
          "A knowledgeable educator who provides clear, informative guidance on waste management",
        gender: "male",
        voice_personality: "educational",
        avatar_url: "/avatars/professor-pete.png",
        personality_traits: [
          "knowledgeable",
          "clear",
          "professional",
          "informative",
        ],
        color_theme: "#2196F3",
        animation_styles: {
          idle: "animate-pulse",
          speaking: "animate-pulse scale-105",
          listening: "animate-bounce",
        },
      },
    ];
  },
};
