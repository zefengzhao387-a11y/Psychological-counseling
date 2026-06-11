/**
 * 页面内容壳层 — 统一包裹各路由页面，配合 motion.css 实现区块入场动效
 */
export default function PageShell({ children, className = '' }) {
  return (
    <div className={`page-shell${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}
