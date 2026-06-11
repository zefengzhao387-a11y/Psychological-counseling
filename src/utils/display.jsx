/** 渲染「姓名 + 学号/工号」展示单元 */
export function renderPerson(name, no, fallbackId) {
  const displayName = name || (fallbackId != null ? `用户${fallbackId}` : '-')
  return (
    <span>
      {displayName}
      {no ? <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 8 }}>{no}</span> : null}
    </span>
  )
}
