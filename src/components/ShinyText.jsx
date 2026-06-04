import './ShinyText.css'

export default function ShinyText({
  text,
  className = '',
  speed = 4,
  color = 'rgba(255, 255, 255, 0.68)',
  shineColor = 'rgba(255, 255, 255, 0.98)',
  shineMid = 'rgba(255, 255, 255, 0.82)',
  glowColor = 'rgba(255, 255, 255, 0.12)',
  pauseOnHover = false,
}) {
  return (
    <span
      className={`shiny-text${pauseOnHover ? ' shiny-text--paused' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--shiny-speed': `${speed}s`,
        '--shiny-base': color,
        '--shiny-mid': shineMid,
        '--shiny-highlight': shineColor,
        '--shiny-glow': glowColor,
      }}
    >
      {text}
    </span>
  )
}
