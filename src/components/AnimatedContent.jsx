import './AnimatedContent.css'

export default function AnimatedContent({ children, className = '', contentKey }) {
  return (
    <div
      key={contentKey}
      className={`animated-content${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
