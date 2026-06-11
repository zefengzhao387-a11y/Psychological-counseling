import './BrandLogo.css'

/**
 * 听心品牌 Logo（/public/logo.png）
 * @param {'sm'|'md'|'lg'} size
 */
export default function BrandLogo({ size = 'md', className = '' }) {
  return (
    <img
      src="/logo.png"
      alt="听心 HeartListen"
      className={`brand-logo brand-logo--${size}${className ? ` ${className}` : ''}`}
      draggable={false}
    />
  )
}
