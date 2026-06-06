import { useState } from 'react'
import { Card, Steps, Form, Input, Select, Radio, Button, Result, message, Alert } from 'antd'
import { FileProtectOutlined, FormOutlined } from '@ant-design/icons'
import request from '../../api/request'

const questions = [
  { key: 'q1', label: '近两周是否有持续的情绪低落、焦虑或烦躁？', options: [
    { label: '完全没有', score: 0 }, { label: '偶尔有，不影响生活', score: 5 },
    { label: '经常有，轻度影响', score: 10 }, { label: '持续存在，严重影响', score: 15 },
  ]},
  { key: 'q2', label: '近期是否有睡眠问题（入睡困难、早醒、多梦等）？', options: [
    { label: '睡眠正常', score: 0 }, { label: '偶尔失眠', score: 5 },
    { label: '经常失眠', score: 10 }, { label: '几乎每晚都睡不好', score: 15 },
  ]},
  { key: 'q3', label: '近期的食欲或体重是否有明显变化？', options: [
    { label: '无变化', score: 0 }, { label: '轻微变化', score: 3 },
    { label: '明显变化', score: 8 }, { label: '变化很大，令人担忧', score: 12 },
  ]},
  { key: 'q4', label: '注意力集中是否有困难（学习、阅读、交谈等）？', options: [
    { label: '无困难', score: 0 }, { label: '偶尔分心', score: 3 },
    { label: '经常难以集中', score: 8 }, { label: '几乎无法集中注意力', score: 12 },
  ]},
  { key: 'q5', label: '近期是否有自我否定或自我价值感降低的想法？', options: [
    { label: '没有', score: 0 }, { label: '偶尔有', score: 5 },
    { label: '经常有', score: 12 }, { label: '持续感到无价值', score: 18 },
  ]},
  { key: 'q6', label: '是否曾经有过伤害自己或结束生命的念头？', options: [
    { label: '从来没有', score: 0 }, { label: '偶尔闪过，但不会做', score: 8 },
    { label: '曾认真考虑过', score: 18 }, { label: '近期有过具体计划', score: 25 },
  ]},
  { key: 'q7', label: '近期的人际关系状态如何？', options: [
    { label: '关系良好', score: 0 }, { label: '偶尔有摩擦', score: 3 },
    { label: '经常感到孤独或被排斥', score: 8 }, { label: '严重冲突或孤立', score: 12 },
  ]},
  { key: 'q8', label: '来访的主要原因是什么？', options: [
    { label: '学业压力', score: 3 }, { label: '情绪困扰', score: 5 },
    { label: '人际关系', score: 3 }, { label: '恋爱/情感问题', score: 3 },
    { label: '职业规划迷茫', score: 3 }, { label: '自我探索成长', score: 2 },
    { label: '家庭问题', score: 5 }, { label: '其他', score: 3 },
  ]},
]

const CONSENT_TEXT = `知情同意书

尊敬的来访同学：

欢迎您来到心理健康中心寻求帮助。在正式开始咨询服务之前，请您仔细阅读以下内容：

一、服务说明
本中心为全校学生提供免费的心理咨询服务，旨在帮助您更好地应对学习、生活中的心理困扰，促进个人成长与发展。

二、保密原则
1. 咨询师对您的个人信息及咨询内容严格保密，未经您的书面同意，不会向任何第三方透露。
2. 以下情况属于保密例外：来访者有伤害自己或他人的危险时；未成年人受到虐待或忽视时；法律要求披露时。

三、来访者的权利与义务
1. 您有权了解咨询师的专业背景、咨询方法和流程。
2. 您有权选择或更换咨询师。
3. 您应按照预约时间准时到达，如需取消请提前24小时通知。
4. 您应在咨询过程中如实提供相关信息，以便咨询师更好地帮助您。

四、咨询设置
1. 每次咨询时长约50分钟。
2. 咨询频率一般为每周一次，具体可根据双方协商调整。
3. 咨询关系的建立与终止应经过双方协商。

五、初访登记
初访（首次来访）是为全面了解您的情况而设置的必要环节。初访员将通过结构化访谈评估您的心理状态，并根据评估结果为您匹配最合适的咨询服务。

我已仔细阅读并理解上述内容，同意按照知情同意书的约定接受心理健康中心的咨询服务。`

export default function FirstVisitForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [form] = Form.useForm()
  const [answers, setAnswers] = useState({})
  const [totalScore, setTotalScore] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [formId, setFormId] = useState(null)
  const [consentDone, setConsentDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleAnswerChange = (changedValues, allValues) => {
    let score = 0
    const current = { ...answers, ...allValues }
    setAnswers(current)
    Object.values(current).forEach(val => {
      if (typeof val === 'number') score += val
    })
    setTotalScore(score)
  }

  const handleSubmitForm = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const scores = questions.map(q => values[q.key] || 0)
      const payload = {
        studentName: localStorage.getItem('username') || '',
        studentNo: localStorage.getItem('userNo') || '',
        gender: values.gender,
        department: values.department,
        phone: values.phone,
        questionnaire: JSON.stringify({ scores }),
        totalScore,
        isUrgent: totalScore > 60 ? 1 : 0,
      }
      const res = await request.post('/v1/appointment/form', payload)
      setFormId(res.data.id)
      setSubmitted(true)
      setCurrentStep(1)
    } catch {
      // 表单校验失败
    } finally {
      setSubmitting(false)
    }
  }

  const handleConsent = async () => {
    try {
      await request.put(`/v1/appointment/form/${formId}/consent`)
      setConsentDone(true)
      message.success('知情同意书确认成功，您可以前往初访预约页面进行预约')
    } catch {
      message.error('确认失败，请重试')
    }
  }

  const isUrgent = totalScore > 60

  return (
    <Card title="首访登记表">
      <Steps
        current={currentStep}
        style={{ marginBottom: 32 }}
        items={[
          { title: '填写问卷', icon: <FormOutlined /> },
          { title: '知情同意书', icon: <FileProtectOutlined /> },
        ]}
      />

      {currentStep === 0 && (
        <>
          {isUrgent && (
            <Alert
              type="warning"
              showIcon
              message={`问卷总分 ${totalScore} 分，超过60分临界值，系统将标记为紧急并优先排队。`}
              style={{ marginBottom: 16 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleAnswerChange}
            initialValues={{ gender: '男' }}
          >
            <Card type="inner" title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                <Select options={[
                  { value: '男', label: '男' }, { value: '女', label: '女' },
                ]} />
              </Form.Item>
              <Form.Item name="department" label="院系" rules={[{ required: true, message: '请输入院系' }]}>
                <Input placeholder="如：计算机学院" />
              </Form.Item>
              <Form.Item name="phone" label="联系电话" rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}>
                <Input placeholder="请输入11位手机号" />
              </Form.Item>
            </Card>

            <Card type="inner" title="心理健康问卷" size="small">
              {questions.map((q, idx) => (
                <Form.Item
                  key={q.key}
                  name={q.key}
                  label={`${idx + 1}. ${q.label}`}
                  rules={[{ required: true, message: '请选择' }]}
                >
                  <Radio.Group
                    options={q.options.map(o => ({
                      value: o.score,
                      label: `${o.label}（${o.score}分）`,
                    }))}
                  />
                </Form.Item>
              ))}

              <div style={{ textAlign: 'right', marginTop: 16, fontSize: 16 }}>
                当前总分：<strong style={{ color: isUrgent ? '#ff4d4f' : '#1677ff', fontSize: 20 }}>
                  {totalScore}
                </strong> 分
                {isUrgent && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>（将标记为紧急）</span>}
              </div>
            </Card>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button type="primary" size="large" loading={submitting} onClick={handleSubmitForm}>
                提交登记表
              </Button>
            </div>
          </Form>
        </>
      )}

      {currentStep === 1 && !consentDone && (
        <>
          <Card
            type="inner"
            title="知情同意书"
            style={{ marginBottom: 16, maxHeight: 400, overflow: 'auto' }}
          >
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 2 }}>
              {CONSENT_TEXT}
            </pre>
          </Card>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button type="primary" size="large" onClick={handleConsent}>
              我已阅读并同意
            </Button>
          </div>
        </>
      )}

      {consentDone && (
        <Result
          status="success"
          title="登记完成"
          subTitle={isUrgent
            ? '您的高风险问卷已标记为紧急，管理员将优先审核您的预约，请留意通知。'
            : '您的首访登记表已提交成功，请前往初访预约页面选择合适的时间进行预约。'}
          extra={[
            <Button type="primary" key="appointment" onClick={() => window.location.href = '/student/appointment'}>
              前往初访预约
            </Button>,
          ]}
        />
      )}
    </Card>
  )
}
