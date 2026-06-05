import './StarBorder.css'

export default function StarBorder({
  as: Component = 'button',
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
  style,
  ...rest
}) {
  return (
    <Component
      className={`star-border-container${className ? ` ${className}` : ''}`}
      style={{ padding: `${thickness}px 0`, ...style }}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
        aria-hidden
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
        aria-hidden
      />
      <div className="inner-content">{children}</div>
    </Component>
  )
}
