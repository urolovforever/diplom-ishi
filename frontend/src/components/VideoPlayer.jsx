import React, { useState, useRef } from 'react'
import { FiVolume2, FiVolumeX, FiPlay, FiPause } from 'react-icons/fi'

const VideoPlayer = ({ videoFile }) => {
  const videoRef = useRef(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  if (!videoFile) {
    return null
  }

  const toggleMute = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const togglePlay = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVideoClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    togglePlay(e)
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-black group">
      <video
        ref={videoRef}
        src={videoFile.file}
        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
        muted={isMuted}
        loop
        playsInline
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play/Pause Overlay - Show on hover or when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={togglePlay}
            className="bg-white/90 hover:bg-white p-4 rounded-full transition-all transform hover:scale-110"
            aria-label="Play video"
          >
            <FiPlay size={32} className="text-gray-800" />
          </button>
        </div>
      )}

      {/* Controls - Bottom Right */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2">
        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
        </button>

        {/* Play/Pause Button - visible on hover */}
        <button
          onClick={togglePlay}
          className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
        </button>
      </div>

      {/* Video Badge - Top Left */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
        <FiPlay size={14} />
        <span>Video</span>
      </div>
    </div>
  )
}

export default VideoPlayer
