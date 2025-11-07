import React, { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const MediaCarousel = ({ mediaFiles }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!mediaFiles || mediaFiles.length === 0) {
    return null
  }

  const goToPrevious = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1))
  }

  const goToNext = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1))
  }

  const goToSlide = (index, e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex(index)
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-gray-100">
      {/* Current Image */}
      <img
        src={mediaFiles[currentIndex].file}
        alt={`Slide ${currentIndex + 1}`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Navigation Arrows - Only show if more than 1 image */}
      {mediaFiles.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
            aria-label="Previous image"
          >
            <FiChevronLeft size={24} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
            aria-label="Next image"
          >
            <FiChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {mediaFiles.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(index, e)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {mediaFiles.length}
          </div>
        </>
      )}
    </div>
  )
}

export default MediaCarousel
