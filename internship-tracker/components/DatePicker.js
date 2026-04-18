'use client'
import { useState, useRef, useEffect } from 'react'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatValue(date) {
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDisplay(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${y}/${m}/${d}`
}

export default function DatePicker({ value, onChange, placeholder = '选择日期' }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    const d = parseDate(value)
    return d ? d.getFullYear() : new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseDate(value)
    return d ? d.getMonth() : new Date().getMonth()
  })
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open && value) {
      const d = parseDate(value)
      if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()) }
    }
  }, [open])

  const today = new Date(); today.setHours(0,0,0,0)
  const selected = parseDate(value)

  const firstDay = new Date(viewYear, viewMonth, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const selectDay = (day) => {
    if (!day) return
    const d = new Date(viewYear, viewMonth, day)
    onChange(formatValue(d))
    setOpen(false)
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange(null)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          ...s.input,
          color: value ? 'var(--text)' : '#bbb',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span>{value ? formatDisplay(value) : placeholder}</span>
        <span style={{ fontSize: 14, color: '#aaa' }}>📅</span>
      </div>

      {open && (
        <div style={s.popup}>
          {/* Header */}
          <div style={s.header}>
            <button style={s.navBtn} onClick={prevMonth}>‹</button>
            <span style={s.monthLabel}>{viewYear}年 {MONTHS[viewMonth]}</span>
            <button style={s.navBtn} onClick={nextMonth}>›</button>
          </div>

          {/* Weekdays */}
          <div style={s.grid}>
            {WEEKDAYS.map(w => (
              <div key={w} style={s.weekday}>{w}</div>
            ))}

            {/* Days */}
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />
              const thisDate = new Date(viewYear, viewMonth, day)
              thisDate.setHours(0,0,0,0)
              const isSelected = selected && thisDate.getTime() === selected.getTime()
              const isToday = thisDate.getTime() === today.getTime()
              return (
                <div
                  key={day}
                  style={{
                    ...s.day,
                    ...(isSelected ? s.daySelected : {}),
                    ...(isToday && !isSelected ? s.dayToday : {}),
                  }}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={s.footer}>
            <button style={s.clearBtn} onClick={clear}>清除</button>
            <button style={s.todayBtn} onClick={() => {
              const t = new Date()
              setViewYear(t.getFullYear())
              setViewMonth(t.getMonth())
              selectDay(t.getDate())
            }}>今天</button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  input: {
    padding: '9px 12px',
    border: '1.5px solid #e8e8e8',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    background: '#fafafa',
    width: '100%',
    boxSizing: 'border-box',
  },
  popup: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    zIndex: 9999,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
    padding: '14px',
    width: 260,
    animation: 'fadeIn 0.15s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text)',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: 'var(--accent)',
    padding: '0 6px',
    lineHeight: 1,
    borderRadius: 6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#aaa',
    padding: '4px 0',
  },
  day: {
    textAlign: 'center',
    fontSize: 13,
    padding: '6px 0',
    borderRadius: 6,
    cursor: 'pointer',
    color: 'var(--text)',
    transition: 'background 0.1s',
  },
  daySelected: {
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 700,
  },
  dayToday: {
    background: 'rgba(59,111,160,0.1)',
    color: 'var(--accent)',
    fontWeight: 700,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #f0f0f0',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    fontSize: 12,
    color: '#aaa',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
  },
  todayBtn: {
    background: 'var(--accent-light)',
    border: 'none',
    fontSize: 12,
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 6,
    fontWeight: 600,
  },
}
