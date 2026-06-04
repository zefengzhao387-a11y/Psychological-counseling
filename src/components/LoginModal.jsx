import { Modal } from 'antd'
import { BRAND } from '../constants/brand'
import LoginForm from './LoginForm'
import '../pages/Login.css'

export default function LoginModal({ open, onClose, onSuccess }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      destroyOnClose
      className="login-modal"
      title={(
        <div className="login-modal-header">
          <span className="login-modal-title">{BRAND.name}</span>
          <span className="login-modal-title-en">{BRAND.nameEn}</span>
        </div>
      )}
    >
      <p className="login-modal-desc">Sign in · {BRAND.org}</p>
      <div className="login-form-card login-form-card--modal">
        <LoginForm
          onSuccess={(result) => {
            onClose?.()
            onSuccess?.(result)
          }}
        />
      </div>
    </Modal>
  )
}
