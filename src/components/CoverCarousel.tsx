import { useEffect, useState } from 'react'
import cover1 from '../assets/cover/cover-1.jpg'
import cover2 from '../assets/cover/cover-2.jpg'
import cover3 from '../assets/cover/cover-3.jpeg'

const slides = [
  {
    src: cover1,
    alt: 'Cortez TCG Live stream setup with One Piece booster boxes and cards',
  },
  {
    src: cover2,
    alt: 'Live pack opening moment from Cortez TCG Live',
  },
  {
    src: cover3,
    alt: 'Community pull night at Cortez TCG Live',
  },
] as const

const INTERVAL_MS = 4200

export default function CoverCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [paused])

  return (
    <div
      className="cover-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <div className="cover-track" aria-live="polite">
        {slides.map((slide, slideIndex) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`cover-slide${slideIndex === index ? ' is-active' : ''}`}
            aria-hidden={slideIndex !== index}
          />
        ))}
      </div>

      <div className="cover-dots" role="tablist" aria-label="Cover images">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Show slide ${slideIndex + 1}`}
            className={`cover-dot${slideIndex === index ? ' is-active' : ''}`}
            onClick={() => setIndex(slideIndex)}
          />
        ))}
      </div>
    </div>
  )
}
