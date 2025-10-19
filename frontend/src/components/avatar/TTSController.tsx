"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { AvatarPersonality } from "./InteractiveAvatarSystem";

interface TTSControllerProps {
  text: string;
  voicePersonality: AvatarPersonality;
  onComplete: () => void;
  volume: number;
  isMuted: boolean;
}

export interface TTSControllerRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
}

export const TTSController = forwardRef<TTSControllerRef, TTSControllerProps>(
  ({ text, voicePersonality, onComplete, volume, isMuted }, ref) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isPlayingRef = useRef(false);
    const currentTextRef = useRef("");

    useImperativeHandle(ref, () => ({
      play: () => {
        if (audioRef.current && !isMuted) {
          audioRef.current.play();
          isPlayingRef.current = true;
        }
      },
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          isPlayingRef.current = false;
        }
      },
      stop: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          isPlayingRef.current = false;
        }
      },
      get isPlaying() {
        return isPlayingRef.current;
      },
    }));

    // Generate TTS audio when text changes
    useEffect(() => {
      if (!text || text.trim() === "" || text === currentTextRef.current)
        return;

      console.log(
        `TTS Controller: New text received - "${text}" with voice ${voicePersonality}`
      );
      currentTextRef.current = text;

      // Add a delay to ensure the previous audio has stopped and prevent rapid changes
      const timer = setTimeout(() => {
        generateTTSAudio(text, voicePersonality);
      }, 200);

      return () => clearTimeout(timer);
    }, [text, voicePersonality]);

    // Update volume when it changes
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
      }
    }, [volume, isMuted]);

    const generateTTSAudio = async (
      textToSpeak: string,
      personality: AvatarPersonality
    ) => {
      try {
        console.log(
          `Generating TTS for: "${textToSpeak}" with personality: ${personality}`
        );

        // Stop any currently playing audio and clean up
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          // Remove all event listeners
          audioRef.current.removeEventListener("ended", () => {});
          audioRef.current.removeEventListener("error", () => {});
          audioRef.current.removeEventListener("loadstart", () => {});
          audioRef.current.removeEventListener("canplay", () => {});
          audioRef.current.src = "";
          audioRef.current = null;
        }
        isPlayingRef.current = false;

        // Check if backend is available by testing the connection first
        let useBackendTTS = false;
        try {
          const healthCheck = await fetch("/api/chatbot/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: "test",
              voice_personality: "friendly",
            }),
            signal: AbortSignal.timeout(2000), // 2 second timeout
          });
          
          if (healthCheck.ok) {
            useBackendTTS = true;
            console.log("Backend TTS is available, using it");
          }
        } catch (error) {
          console.log("Backend TTS not available, using fallback:", error);
        }

        if (useBackendTTS) {
          // Call the backend TTS endpoint
          const response = await fetch("/api/chatbot/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: textToSpeak,
              voice_personality: personality,
            }),
          });

          console.log(`TTS Response status: ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              `TTS request failed: ${response.status} - ${errorText}`
            );
            throw new Error(
              `TTS request failed: ${response.status} - ${errorText}`
            );
          }

          const data = await response.json();
          console.log("TTS Response data:", data);

          if (data.audio_url) {
            // Create audio element and play
            const audio = new Audio(data.audio_url);
            audio.volume = isMuted ? 0 : volume;
            audio.preload = "auto";

            const handleEnded = () => {
              console.log("TTS audio ended");
              isPlayingRef.current = false;
              onComplete();
            };

            const handleError = (e: Event) => {
              console.error("TTS audio error:", e);
              isPlayingRef.current = false;
              onComplete(); // Still call onComplete to continue the flow
            };

            const handleLoadStart = () => {
              console.log("TTS audio loading started");
              isPlayingRef.current = true;
            };

            const handleCanPlay = async () => {
              console.log("TTS audio can play");
              try {
                if (!isMuted) {
                  await audio.play();
                  console.log("TTS audio playing");
                } else {
                  // If muted, still call onComplete after a delay to simulate speech duration
                  const estimatedDuration =
                    (textToSpeak.split(" ").length / 150) * 60 * 1000; // 150 WPM
                  setTimeout(() => {
                    isPlayingRef.current = false;
                    onComplete();
                  }, Math.max(estimatedDuration, 1000));
                }
              } catch (playError) {
                console.error("Error playing TTS audio:", playError);
                isPlayingRef.current = false;
                onComplete();
              }
            };

            audio.addEventListener("ended", handleEnded);
            audio.addEventListener("error", handleError);
            audio.addEventListener("loadstart", handleLoadStart);
            audio.addEventListener("canplay", handleCanPlay);

            audioRef.current = audio;
            return;
          }
        }

        // Fallback: Use browser's built-in speech synthesis
        console.log("Using browser TTS fallback");
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Set voice properties based on personality
        const voices = speechSynthesis.getVoices();
        let selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        
        if (personality === "enthusiastic" && voices.length > 0) {
          // Try to find a more energetic voice
          selectedVoice = voices.find(voice => 
            voice.name.includes('female') || voice.name.includes('woman')
          ) || voices[0];
        } else if (personality === "educational" && voices.length > 0) {
          // Try to find a more professional voice
          selectedVoice = voices.find(voice => 
            voice.name.includes('male') || voice.name.includes('man')
          ) || voices[0];
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        // Adjust speech properties based on personality
        utterance.rate = personality === "enthusiastic" ? 1.1 : 0.9;
        utterance.pitch = personality === "friendly" ? 1.0 : 0.8;
        utterance.volume = isMuted ? 0 : volume;

        utterance.onstart = () => {
          console.log("Browser TTS started");
          isPlayingRef.current = true;
        };

        utterance.onend = () => {
          console.log("Browser TTS ended");
          isPlayingRef.current = false;
          onComplete();
        };

        utterance.onerror = (event) => {
          console.warn("Browser TTS error:", event);
          isPlayingRef.current = false;
          // Still call onComplete to continue the flow even if TTS fails
          onComplete();
        };

        // Start speaking with error handling
        try {
          speechSynthesis.speak(utterance);
        } catch (speakError) {
          console.warn("Failed to start speech synthesis:", speakError);
          // Fallback: simulate speech duration
          const estimatedDuration = (textToSpeak.split(" ").length / 150) * 60 * 1000;
          setTimeout(() => {
            isPlayingRef.current = false;
            onComplete();
          }, Math.max(estimatedDuration, 1000));
        }

      } catch (error) {
        console.error("TTS generation failed:", error);
        // Final fallback: simulate speech duration
        const estimatedDuration =
          (textToSpeak.split(" ").length / 150) * 60 * 1000; // 150 WPM
        console.log(`TTS fallback: simulating ${estimatedDuration}ms duration`);
        setTimeout(() => {
          isPlayingRef.current = false;
          onComplete();
        }, Math.max(estimatedDuration, 1000));
      }
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.removeEventListener("ended", () => {});
          audioRef.current.removeEventListener("error", () => {});
          audioRef.current.removeEventListener("loadstart", () => {});
          audioRef.current.removeEventListener("canplay", () => {});
          audioRef.current = null;
        }
        isPlayingRef.current = false;
      };
    }, []);

    return null; // This component doesn't render anything
  }
);

TTSController.displayName = "TTSController";
