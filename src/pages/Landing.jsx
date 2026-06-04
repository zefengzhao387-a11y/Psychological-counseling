import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, message } from 'antd'
import { HeartOutlined } from '@ant-design/icons'
import Particles from '../components/Particles'
import LoginModal from '../components/LoginModal'
import { BRAND, ROLE_HOME_MAP } from '../constants/brand'
import './Landing.css'
import './Login.css'

const PARTICLE_COLORS = ['#ffffff']

export default function Landing() {
  const [loginOpen, setLoginOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const roleCode = Number(localStorage.getItem('roleCode'))
    if (token && ROLE_HOME_MAP[roleCode]) {
      navigate(ROLE_HOME_MAP[roleCode], { replace: true })
    }
  }, [navigate])

  const handleLoginSuccess = ({ username, roleName, redirectTo }) => {
    message.success(`欢迎，${username}（${roleName}）`)
    navigate(redirectTo || '/')
  }

  return (
    <div className="landing-page">
      <div className="landing-bg">
        <Particles
          particleColors={PARTICLE_COLORS}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
        />
      </div>

      <header className="landing-header">
        <span className="landing-header-icon">
          <HeartOutlined />
        </span>
        <button type="button" className="landing-header-login" onClick={() => setLoginOpen(true)}>
          登录
        </button>
      </header>

      <main className="landing-main">
        <div className="landing-copy">
          <p className="landing-label">· {BRAND.label}</p>
          <h1 className="landing-title">{BRAND.name}</h1>
          <p className="landing-system-note">{BRAND.systemNote}</p>
          <p className="landing-subtitle">{BRAND.tagline}</p>
          <p className="landing-desc">{BRAND.desc}</p>
          <Button className="landing-btn-login" size="large" onClick={() => setLoginOpen(true)}>
            登录
          </Button>
        </div>
      </main>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}
