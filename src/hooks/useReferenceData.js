import { useState, useEffect, useMemo, useCallback } from 'react'
import request from '../api/request'

/** 老师类型标签 */
export const teacherTypeLabel = (type) => (type === 1 ? '初访员' : '咨询师')

/**
 * 加载老师列表（初访员 + 咨询师）
 * @param {number|null} typeFilter 1=初访员 2=咨询师 null=全部
 */
export function useTeachers(typeFilter = null) {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    request.get('/v1/user/counselor/list')
      .then((res) => {
        if (!cancelled) setTeachers(res.data || [])
      })
      .catch(() => {
        if (!cancelled) setTeachers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (typeFilter == null) return teachers
    return teachers.filter((t) => t.type === typeFilter)
  }, [teachers, typeFilter])

  const options = useMemo(() => filtered.map((t) => ({
    value: t.userId,
    label: `${t.name}（${teacherTypeLabel(t.type)}）`,
    type: t.type,
    name: t.name,
  })), [filtered])

  return { teachers: filtered, options, loading }
}

/** 加载时间段配置 */
export function useTimeSlots() {
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    request.get('/v1/appointment/time-config')
      .then((res) => {
        if (!cancelled) setTimeSlots(res.data || [])
      })
      .catch(() => {
        if (!cancelled) setTimeSlots([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const options = useMemo(() => timeSlots.map((t) => ({
    value: t.id,
    label: t.slotName,
  })), [timeSlots])

  return { timeSlots, options, loading }
}

/** 加载咨询师可写结案报告的安排（已结案/脱落且尚未写报告） */
export function useClosableAppointments(counselorId, enabled = true) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAppointments = useCallback(() => {
    if (!counselorId || !enabled) {
      setAppointments([])
      return Promise.resolve()
    }
    setLoading(true)
    return request.get('/v1/consultation/records', {
      params: { page: 1, size: 100, counselorId, closableOnly: true },
      silent: true,
    })
      .then((res) => setAppointments(res.data?.records || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false))
  }, [counselorId, enabled])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const options = useMemo(() => appointments.map((a) => {
    const statusLabel = a.status === 3 ? '已脱落' : '已结案'
    return {
      value: a.id,
      label: `${a.studentName || '学生'}（${a.studentNo || '-'}）· ${statusLabel} · ${a.startDate || ''} · ${a.timeSlotName || a.location || ''}`,
      record: a,
    }
  }), [appointments])

  return { appointments, options, loading, refresh: fetchAppointments }
}

/** 加载咨询师进行中的咨询安排 */
export function useCounselorAppointments(counselorId) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!counselorId) {
      setAppointments([])
      return undefined
    }
    let cancelled = false
    setLoading(true)
    request.get('/v1/consultation/records', {
      params: { page: 1, size: 100, counselorId },
    })
      .then((res) => {
        if (!cancelled) {
          const list = res.data?.records || res.data || []
          setAppointments(list.filter((a) => a.status === 1))
        }
      })
      .catch(() => {
        if (!cancelled) setAppointments([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [counselorId])

  const options = useMemo(() => appointments.map((a) => ({
    value: a.id,
    label: `${a.studentName || '学生'}${a.studentNo ? `（${a.studentNo}）` : ''} · ${a.startDate || ''} · ${a.timeSlotName || a.location || ''}`,
    record: a,
  })), [appointments])

  return { appointments, options, loading }
}
