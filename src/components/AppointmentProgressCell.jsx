import { Tag } from 'antd'

export default function AppointmentProgressCell({ firstVisit, consultation, closing }) {
  const tag = (label, text, highlight) => (
    <Tag color={highlight ? 'blue' : 'default'} style={{ marginBottom: 4 }}>
      {label}：{text || '—'}
    </Tag>
  )
  const consultActive = consultation && consultation !== '—' && consultation !== '待评估'
  const closingActive = closing && closing !== '—' && !String(closing).startsWith('未')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 150 }}>
      {tag('初访', firstVisit, !!firstVisit)}
      {tag('咨询', consultation, consultActive)}
      {tag('结案', closing, closingActive)}
    </div>
  )
}
