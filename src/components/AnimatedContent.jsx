import './AnimatedContent.css'

export default function AnimatedContent({ children, className = '', contentKey, direction = 'up' }) {
  return (
    <div
      key={contentKey}
      className={`animated-content animated-content--${direction}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
