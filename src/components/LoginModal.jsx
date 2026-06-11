import { useState } from 'react'
import { Modal, message } from 'antd'
import { BRAND } from '../constants/brand'
import BrandLogo from './BrandLogo'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import AnimatedContent from './AnimatedContent'
import '../pages/Login.css'

const TABS = [
  { key: 'login', label: '登录' },
  { key: 'register', label: '学生注册' },
]

export default function LoginModal({ open, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('login')
  const [slideDirection, setSlideDirection] = useState('right')

  const handleClose = () => {
    setActiveTab('login')
    setSlideDirection('right')
    onClose?.()
  }

  const switchTab = (key) => {
    if (key === activeTab) return
    setSlideDirection(key === 'register' ? 'right' : 'left')
    setActiveTab(key)
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={440}
      destroyOnClose
      className="login-modal"
      title={(
        <div className="login-modal-header">
          <BrandLogo size="sm" className="login-modal-logo" />
          <span className="login-modal-title">{BRAND.name}</span>
          <span className="login-modal-title-en">{BRAND.nameEn}</span>
        </div>
      )}
    >
      <p className="login-modal-desc">Sign in · {BRAND.org}</p>
      <div className="login-form-card login-form-card--modal">
        <div className="login-modal-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`login-modal-tab${activeTab === tab.key ? ' login-modal-tab--active' : ''}`}
              onClick={() => switchTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="login-modal-panel">
          <AnimatedContent contentKey={activeTab} direction={slideDirection}>
            {activeTab === 'login' ? (
              <LoginForm
                onSuccess={(result) => {
                  handleClose()
                  onSuccess?.(result)
                }}
              />
            ) : (
              <RegisterForm
                onSuccess={() => {
                  message.success('注册成功，请登录')
                  switchTab('login')
                }}
              />
            )}
          </AnimatedContent>
        </div>
      </div>
    </Modal>
  )
}
