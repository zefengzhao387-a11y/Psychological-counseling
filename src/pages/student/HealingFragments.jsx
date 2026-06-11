import { useState, useEffect, useCallback } from 'react'
import { Input, Button, message, Spin, Popconfirm } from 'antd'
import { ThunderboltOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { generateFragment, listFragments, markFragmentRead, deleteFragment } from '../../api/healing'
import './HealingFragments.css'

const { TextArea } = Input

const MOOD_OPTIONS = [
  { level: 1, emoji: '😢', label: '很差' },
  { level: 2, emoji: '😔', label: '不太好' },
  { level: 3, emoji: '😐', label: '一般' },
  { level: 4, emoji: '😊', label: '不错' },
  { level: 5, emoji: '😄', label: '很好' },
]

const FRAGMENT_COLORS = [
  'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
  'linear-gradient(135deg, #0c1929 0%, #1a365d 100%)',
  'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
  'linear-gradient(135deg, #1a0830 0%, #2b1947 100%)',
  'linear-gradient(135deg, #0d131f 0%, #1b2845 100%)',
]

export default function HealingFragments() {
  const [fragments, setFragments] = useState([])
  const [moodLevel, setMoodLevel] = useState(null)
  const [note, setNote] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchFragments = useCallback(async () => {
    try {
      const res = await listFragments()
      setFragments(res.data || [])
    } catch {
      // 已在拦截器中提示
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFragments()
  }, [fetchFragments])

  /** 生成碎片 */
  const handleGenerate = async () => {
    if (!moodLevel) {
      message.warning('请先选择一个代表今天心情的表情')
      return
    }
    setGenerating(true)
    try {
      const res = await generateFragment({ moodLevel, note: note.trim() || undefined })
      message.success('✨ 你的治愈碎片已生成')
      setMoodLevel(null)
      setNote('')
      // 把新碎片插入到最前面
      setFragments((prev) => [res.data, ...prev])
    } catch {
      // 已在拦截器中提示
    } finally {
      setGenerating(false)
    }
  }

  /** 标记已读 */
  const handleRead = async (frag) => {
    if (frag.isRead === 1) return
    try {
      await markFragmentRead(frag.id)
      setFragments((prev) =>
        prev.map((f) => (f.id === frag.id ? { ...f, isRead: 1 } : f))
      )
    } catch {
      // ignore
    }
  }

  /** 删除碎片 */
  const handleDelete = async (fragId) => {
    try {
      await deleteFragment(fragId)
      setFragments((prev) => prev.filter((f) => f.id !== fragId))
      message.success('已删除')
    } catch {
      // 已在拦截器中提示
    }
  }

  return (
    <div className="fragments-page">
      {/* ========== 生成区 ========== */}
      <div className="fragments-generate-card">
        <div className="fragments-generate-inner">
          <div className="fragments-generate-title">
            <em>💫</em> 今天的心情如何？
          </div>

          {/* 心情选择器 */}
          <div className="mood-selector">
            {MOOD_OPTIONS.map((opt) => (
              <div
                key={opt.level}
                className={`mood-option${moodLevel === opt.level ? ' mood-option--active' : ''}`}
                onClick={() => setMoodLevel(opt.level)}
              >
                <span className="mood-option-emoji">{opt.emoji}</span>
                <span className="mood-option-label">{opt.label}</span>
              </div>
            ))}
          </div>

          {/* 笔记输入 */}
          <div className="fragments-note">
            <TextArea
              placeholder="有什么想说的吗？(可选，最多200字)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={3}
              showCount
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </div>

          {/* 生成按钮 */}
          <Button
            className="fragments-generate-btn"
            onClick={handleGenerate}
            loading={generating}
            icon={<ThunderboltOutlined />}
          >
            {generating ? '正在为你生成治愈碎片…' : '生成治愈碎片'}
          </Button>
        </div>
      </div>

      {/* ========== 生成中动画 ========== */}
      {generating && (
        <div className="fragments-generating">
          <div className="fragments-generating-dots">
            <div className="fragments-generating-dot" />
            <div className="fragments-generating-dot" />
            <div className="fragments-generating-dot" />
          </div>
          <p className="fragments-generating-text">
            正在聆听你的心情，为你编织独一无二的治愈碎片…
          </p>
        </div>
      )}

      {/* ========== 碎片列表 ========== */}
      {loading ? (
        <div className="fragments-loading">
          <Spin size="large" />
        </div>
      ) : fragments.length === 0 && !generating ? (
        <div className="fragments-empty">
          <div className="fragments-empty-emoji">🫧</div>
          <div className="fragments-empty-text">还没有治愈碎片</div>
          <div className="fragments-empty-sub">
            记录今天的心情，生成你的第一片心语碎片吧
          </div>
        </div>
      ) : (
        fragments.map((frag, idx) => (
          <div
            key={frag.id}
            className={`fragment-card${frag.isRead === 0 ? ' fragment-card--unread' : ''}`}
            style={{
              background: FRAGMENT_COLORS[idx % FRAGMENT_COLORS.length],
              animationDelay: `${idx * 0.05}s`,
            }}
            onClick={() => handleRead(frag)}
          >
            <div className="fragment-card-header">
              <div className="fragment-card-mood">
                <span className="fragment-card-mood-emoji">{frag.moodEmoji}</span>
                <span className="fragment-card-mood-label">{frag.moodLabel}</span>
              </div>
              <span className="fragment-card-time">
                {dayjs(frag.createTime).format('MM/DD HH:mm')}
              </span>
            </div>
            <div className="fragment-card-content">{frag.fragmentContent}</div>
            {frag.note && (
              <div className="fragment-card-note">「{frag.note}」</div>
            )}
            <div className="fragment-card-actions">
              <Popconfirm
                title="确定删除这片碎片吗？"
                onConfirm={(e) => {
                  e.stopPropagation()
                  handleDelete(frag.id)
                }}
                onCancel={(e) => e.stopPropagation()}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                >
                  删除
                </Button>
              </Popconfirm>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
