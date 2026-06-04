import { useEffect, useRef, useState } from 'react'
import './BlurText.css'

export default function BlurText({
  text = '',
  className = '',
  animateBy = 'words',
  delay = 60,
  duration = 550,
  as: Tag = 'span',
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [text])

  const segments = animateBy === 'chars' ? [...text] : text.split(' ')

  return (
    <Tag ref={ref} className={`blur-text${className ? ` ${className}` : ''}`}>
      {visible &&
        segments.map((segment, index) => (
          <span
            key={`${segment}-${index}`}
            className="blur-text__segment"
            style={{
              '--blur-delay': `${index * delay}ms`,
              '--blur-duration': `${duration}ms`,
            }}
          >
            {segment}
            {animateBy === 'words' && index < segments.length - 1 ? '\u00A0' : ''}
          </span>
        ))}
      {!visible && text}
    </Tag>
  )
}
