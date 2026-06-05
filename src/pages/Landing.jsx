import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { HeartOutlined } from '@ant-design/icons'
import Particles from '../components/Particles'
import SideRays from '../components/SideRays'
import TextType from '../components/TextType'
import StarBorder from '../components/StarBorder'
import CardSwap, { Card } from '../components/CardSwap'
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
        <div className="landing-bg-layer landing-bg-particles">
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
        <div className="landing-bg-layer landing-bg-rays">
          <SideRays
            speed={2.5}
            rayColor1="#EAB308"
            rayColor2="#96c8ff"
            intensity={2}
            spread={2}
            origin="bottom-right"
            tilt={0}
            saturation={1.5}
            blend={0.75}
            falloff={1.6}
            opacity={1}
          />
        </div>
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
          <p className="landing-subtitle">
            <TextType
              texts={BRAND.taglineTexts}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor
              cursorCharacter="_"
              deletingSpeed={50}
              variableSpeedEnabled={false}
              variableSpeedMin={60}
              variableSpeedMax={120}
              cursorBlinkDuration={0.5}
            />
          </p>
          <p className="landing-desc">{BRAND.desc}</p>
          <StarBorder
            as="button"
            type="button"
            className="landing-star-border"
            color="white"
            speed="5s"
            onClick={() => setLoginOpen(true)}
          >
            登录
          </StarBorder>
        </div>

        <div className="landing-showcase">
          <CardSwap
            width={340}
            height={240}
            cardDistance={60}
            verticalDistance={70}
            delay={5000}
            pauseOnHover={false}
          >
            <Card>
              <div className="landing-card-inner">
                <p className="landing-card-tag">预约 · Appointment</p>
                <h3 className="landing-card-title">线上初访预约</h3>
                <p className="landing-card-desc">
                  填写首访登记表，选择合适时段，随时查看或撤销预约进度。
                </p>
              </div>
            </Card>
            <Card>
              <div className="landing-card-inner">
                <p className="landing-card-tag">咨询 · Counseling</p>
                <h3 className="landing-card-title">专业心理支持</h3>
                <p className="landing-card-desc">
                  初访员与咨询师协同跟进，全程保密，让倾诉更安心。
                </p>
              </div>
            </Card>
            <Card>
              <div className="landing-card-inner">
                <p className="landing-card-tag">AI · Assistant</p>
                <h3 className="landing-card-title">听心智能助手</h3>
                <p className="landing-card-desc">
                  登录后随时唤起 AI，解答系统使用问题，提供基础心理科普。
                </p>
              </div>
            </Card>
          </CardSwap>
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
