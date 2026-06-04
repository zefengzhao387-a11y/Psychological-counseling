import { useEffect, useRef, useState } from 'react'
import { Drawer, Input, Button } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { sendAiChat } from '../api/ai'
import { BRAND } from '../constants/brand'
import './AiChatDrawer.css'

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `你好，我是${BRAND.name} AI 助手。可以问我系统怎么用、预约流程，或一般心理自助建议。我无法替代专业咨询，如有危机请立即联系心理中心。`,
}

export default function AiChatDrawer({ open, onClose }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMessages([WELCOME_MESSAGE])
      setInput('')
    }
  }, [open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const history = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map(({ role, content }) => ({ role, content }))

      const res = await sendAiChat(history)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      const status = err?.response?.status
      let hint = '请稍后再试'
      if (status === 404) {
        hint = 'AI 接口未找到，请在 IDEA 中重新编译并重启 user-service（8081）'
      } else if (status === 401) {
        hint = '登录已过期，请重新登录'
      } else if (err?.message?.includes('DeepSeek')) {
        hint = err.message
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `抱歉，暂时无法回复。${hint}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      title={`${BRAND.name} · AI 助手`}
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
      destroyOnClose
      className="ai-chat-drawer"
    >
      <p className="ai-chat-disclaimer">
        AI 回复仅供参考，不能替代专业心理咨询。如有自伤或危机想法，请立即联系学校心理中心。
      </p>

      <div className="ai-chat-messages" ref={listRef}>
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`ai-chat-bubble ai-chat-bubble--${msg.role}`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div className="ai-chat-bubble ai-chat-bubble--loading">正在思考…</div>}
      </div>

      <div className="ai-chat-input-bar">
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题…"
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={loading}
        />
        <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleSend}>
          发送
        </Button>
      </div>
    </Drawer>
  )
}
