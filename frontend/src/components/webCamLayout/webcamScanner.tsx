"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "../ui/button"
import { Icons } from "../ui/icons"
import { apiClient } from "../../lib/api"
import { ItemDetection } from "../../types"

interface WebcamScannerProps {
  isScanning: boolean
  setIsScanning: (value: boolean) => void
  onImageUpload: (imageData: string) => void
  onDetectionResults?: (results: ItemDetection[]) => void
}

export function WebcamScanner({ isScanning, setIsScanning, onImageUpload, onDetectionResults }: WebcamScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startScanning = async () => {
    try {
      // Simple, widely-used pattern with debug logs
      const constraints: MediaStreamConstraints = { video: true, audio: false }
      console.log("[Scanner] Requesting camera with constraints:", constraints)
      const t0 = performance.now()
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[Scanner] getUserMedia resolved in", Math.round(performance.now() - t0), "ms")
      setStream(mediaStream)
      setIsScanning(true) // ensure <video> mounts before attaching stream
      const track = mediaStream.getVideoTracks()[0]
      console.log("[Scanner] Video track:", {
        label: track?.label,
        readyState: track?.readyState,
        settings: track?.getSettings?.(),
      })
    } catch (error) {
      const err = error as any
      console.error("[Scanner] Error accessing webcam:", err?.name, err?.message, err)
      if (err?.name === "NotAllowedError") {
        alert("Camera permission denied. Allow camera access in the browser and try again.")
      } else if (err?.name === "NotFoundError") {
        alert("No camera found. Connect a camera or select a different device in site settings.")
      } else if (err?.name === "NotReadableError") {
        alert("Camera is busy in another app (Zoom/Meet). Close it and try again.")
      } else if (err?.name === "OverconstrainedError") {
        alert("Requested camera constraints not available. Try default camera.")
      } else {
        alert("Unable to access camera. Please check permissions or try uploading an image instead.")
      }
    }
  }

  const stopScanning = () => {
    if (stream) {
      console.log("[Scanner] Stopping tracks:", stream.getTracks().map(t => ({ kind: t.kind, label: t.label })))
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageData = reader.result as string
      onImageUpload(imageData)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn("[Scanner] captureFrame called without video/canvas ready")
      return null
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    if (!video.videoWidth || !video.videoHeight) {
      console.warn("[Scanner] Video dimensions are 0; skipping capture")
      return null
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.warn("[Scanner] 2D context unavailable")
      return null
    }

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
    console.log("[Scanner] Captured frame size:", canvas.width, canvas.height, "dataUrl length:", dataUrl.length)
    return dataUrl
  }

  // Convert base64 dataURL to File object
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  // Auto-capture and send to backend every 5 seconds
  const performAutoCapture = async () => {
    const dataUrl = captureFrame()
    if (!dataUrl) return

    try {
      const file = dataURLtoFile(dataUrl, `frame-${Date.now()}.jpg`)
      console.log("[Scanner] Sending frame to backend...")
      const response = await apiClient.infer(file)
      console.log("[Scanner] Detection results:", response.items)
      onDetectionResults?.(response.items)
    } catch (error) {
      console.error("[Scanner] Auto-capture failed:", error)
    }
  }

  // Start auto-capture loop when scanning
  useEffect(() => {
    if (isScanning && stream) {
      console.log("[Scanner] Starting auto-capture every 5 seconds")
      intervalRef.current = setInterval(performAutoCapture, 5000)
      
      return () => {
        if (intervalRef.current) {
          console.log("[Scanner] Stopping auto-capture")
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [isScanning, stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  // Attach stream to video element when available and scanning
  useEffect(() => {
    if (stream && videoRef.current && isScanning) {
      console.log("[Scanner] Attaching stream to video element")
      const video = videoRef.current
      video.srcObject = stream
      video.onloadedmetadata = () => {
        console.log("[Scanner] Video metadata loaded, dimensions:", video.videoWidth, video.videoHeight)
      }
      video.onplay = () => console.log("[Scanner] Video started playing")
      video.play().catch((err) => console.warn("[Scanner] video.play() error (effect)", err))
    }
  }, [stream, isScanning])

  return (
    <div className="h-full bg-black border border-gray-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Icons.camera className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">Live Scanner</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {isScanning ? "Scanning in progress..." : "Ready to scan"}
            </p>
          </div>
        </div>

        {isScanning && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm text-primary font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Video Feed - Fixed size to prevent shifting */}
      <div className="flex-1 relative bg-black w-full flex items-center justify-center overflow-hidden">
        {!isScanning ? (
          <div className="text-center space-y-4 p-4 sm:p-8">
            <div className="h-16 sm:h-20 w-16 sm:w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Icons.camera className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Start Scanning</h3>
              <p className="text-gray-400 text-xs sm:text-sm max-w-sm mx-auto">
                Point your camera at an item to identify whether it belongs in recycling, compost, or trash
              </p>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain bg-black" />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 sm:inset-8 border-2 border-primary/50 rounded-lg">
              <div className="absolute top-0 left-0 w-6 sm:w-8 h-6 sm:h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 sm:w-8 h-6 sm:h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border-t border-gray-800 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-3">
          {!isScanning ? (
            <>
              <Button onClick={startScanning} className="flex-1 bg-primary hover:bg-primary/90 text-white" size="lg">
                <Icons.camera className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>
              <Button
                onClick={handleUploadClick}
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                size="lg"
              >
                <Icons.sparkles className="mr-2 h-5 w-5" />
                Upload Image
              </Button>
            </>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
              size="lg"
            >
              <Icons.x className="mr-2 h-5 w-5" />
              Stop Scanning
            </Button>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        {!isScanning && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Having trouble with the scanner? Upload an image instead
          </p>
        )}
      </div>
    </div>
  )
}
