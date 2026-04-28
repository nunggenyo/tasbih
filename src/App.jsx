import { useState, useRef, useCallback, memo, useEffect, useMemo } from 'react'
import './App.css'
import DynamicWallpaper from './DynamicWallpaper'

const MAX_VISIBLE = 8

const THEMES = [
  { id: 'cendana', label: 'Cendana', swatch: 'radial-gradient(circle at 35% 30%, #6a3c16, #221208)' },
  { id: 'perak',   label: 'Perak',   swatch: 'radial-gradient(circle at 35% 30%, #4a5868, #141820)' },
  { id: 'zamrud',  label: 'Zamrud',  swatch: 'radial-gradient(circle at 35% 30%, #1e5828, #0c1e10)' },
  { id: 'lautan',  label: 'Lautan',  swatch: 'radial-gradient(circle at 35% 30%, #1a4060, #080e18)' },
  { id: 'mawar',   label: 'Mawar',   swatch: 'radial-gradient(circle at 35% 30%, #6a2838, #180810)' },
]

const BEAD_TYPES = [
  { id: 'kayu',    label: 'Kayu',    swatch: 'radial-gradient(circle at 35% 30%, #ddb87e, #8e5e30, #2c1104)' },
  { id: 'mutiara', label: 'Mutiara', swatch: 'radial-gradient(circle at 35% 30%, #fffcf8, #d4c8bc, #786858)' },
  { id: 'kristal', label: 'Kristal', swatch: 'radial-gradient(circle at 35% 30%, #e8f4ff, #7ab0d8, #0a3050)' },
  { id: 'akik',    label: 'Akik',    swatch: 'radial-gradient(circle at 35% 30%, #f09090, #9a2828, #2c0404)' },
  { id: 'pirus',   label: 'Pirus',   swatch: 'radial-gradient(circle at 35% 30%, #90e0d8, #208878, #022828)' },
  { id: 'onyx',    label: 'Onyx',    swatch: 'radial-gradient(circle at 35% 30%, #707078, #303038, #080810)' },
  { id: 'ambar',   label: 'Ambar',   swatch: 'radial-gradient(circle at 35% 30%, #ffe890, #c07810, #481800)' },
]

const ZIKIR = [
  { arabic: 'سُبْحَانَ ٱللَّه',                        latin: 'SubhanAllah' },
  { arabic: 'ٱلْحَمْدُ لِلَّه',                        latin: 'Alhamdulillah' },
  { arabic: 'ٱللَّهُ أَكْبَر',                         latin: 'Allahu Akbar' },
  { arabic: 'أَسْتَغْفِرُ ٱللَّه',                     latin: 'Astaghfirullah' },
  { arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّه',              latin: 'Laa ilaaha illallah' },
  { arabic: 'ٱللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّد',       latin: 'Selawat' },
  { arabic: 'سُبْحَانَ ٱللَّهِ وَبِحَمْدِهِ',         latin: 'SubhanAllahi wa bihamdihi' },
]

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function RecordsView({ onClose, onReset }) {
  const [filter, setFilter] = useState('hari')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [confirmReset, setConfirmReset] = useState(false)
  const [sessions, setSessions] = useState(() =>
    JSON.parse(localStorage.getItem('zikir_sessions') || '[]')
  )

  const doResetRekod = () => {
    localStorage.removeItem('zikir_sessions')
    setSessions([])
    setConfirmReset(false)
    onReset()
  }

  const months = useMemo(() => {
    const result = []
    const today = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      result.push(d.toISOString().slice(0, 7))
    }
    return result
  }, [])

  const { entries, label } = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    let filtered, label

    if (filter === 'hari') {
      filtered = sessions.filter(s => s.date === todayStr)
      label = fmtDate(todayStr)
    } else if (filter === 'semalam') {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      filtered = sessions.filter(s => s.date === yesterdayStr)
      label = fmtDate(yesterdayStr)
    } else if (filter === 'bulan') {
      filtered = sessions.filter(s => s.date.startsWith(selectedMonth))
      const [y, m] = selectedMonth.split('-')
      label = new Date(+y, +m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    } else {
      filtered = sessions.filter(s => s.date === selectedDate)
      label = fmtDate(selectedDate)
    }

    const agg = {}
    for (const s of filtered) agg[s.zikir] = (agg[s.zikir] || 0) + s.total
    return { entries: agg, label }
  }, [sessions, filter, selectedDate, selectedMonth])

  const grandTotal = Object.values(entries).reduce((a, b) => a + b, 0)

  return (
    <div className="overlay overlay--modal records-overlay">
      <div className="records-box">
        <div className="records-header">
          <span className="records-title">Rekod Zikir</span>
          <button className="records-close" onClick={onClose}>✕</button>
        </div>

        <div className="records-tabs">
          {[['semalam','Semalam'],['hari','Hari Ini'],['bulan','Bulan'],['tarikh','Tarikh']].map(([val, lbl]) => (
            <button
              key={val}
              className={`records-tab ${filter === val ? 'records-tab--active' : ''}`}
              onClick={() => setFilter(val)}
            >{lbl}</button>
          ))}
        </div>

        {filter === 'bulan' && (
          <div className="month-scroller">
            {months.map(m => {
              const [y, mo] = m.split('-')
              const lbl = new Date(+y, +mo - 1, 1).toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' })
              return (
                <button
                  key={m}
                  className={`month-opt ${selectedMonth === m ? 'month-opt--active' : ''}`}
                  onClick={() => setSelectedMonth(m)}
                >{lbl}</button>
              )
            })}
          </div>
        )}

        {filter === 'tarikh' && (
          <input
            type="date"
            className="records-date-input"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setSelectedDate(e.target.value)}
          />
        )}

        <div className="records-period">{label}</div>

        <div className="records-list">
          {grandTotal === 0 ? (
            <div className="records-empty">Tiada rekod untuk tempoh ini.</div>
          ) : (
            <>
              {Object.entries(entries)
                .sort((a, b) => b[1] - a[1])
                .map(([zikir, count]) => (
                  <div key={zikir} className="records-item">
                    <span className="records-zikir">{zikir}</span>
                    <span className="records-count">{count.toLocaleString()}</span>
                  </div>
                ))}
              <div className="records-divider" />
              <div className="records-item records-item--total">
                <span>Jumlah</span>
                <span>{grandTotal.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        <button className="records-reset-btn" onClick={() => setConfirmReset(true)}>Reset Rekod</button>
      </div>

      {confirmReset && (
        <div className="overlay overlay--modal" style={{ zIndex: 300 }}>
          <div className="modal-box">
            <div className="modal-title">Reset Rekod</div>
            <div className="modal-desc">Semua rekod zikir akan dipadam. Anda pasti?</div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--cancel" onClick={() => setConfirmReset(false)}>Batal</button>
              <button className="modal-btn modal-btn--confirm" onClick={doResetRekod}>Ya, Padam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ZikirPicker({ current, onSelect, onClose }) {
  return (
    <div className="overlay overlay--modal setup-overlay">
      <div className="setup-box" style={{ maxWidth: 300 }}>
        <div className="setup-title" style={{ fontSize: '1.3rem' }}>Tukar Zikir</div>
        <div className="setup-col-list">
          {ZIKIR.map((z, idx) => (
            <button
              key={idx}
              className={`setup-opt ${current === idx ? 'setup-opt--active' : ''}`}
              onClick={() => onSelect(idx)}
            >
              {z.latin}
            </button>
          ))}
        </div>
        <button className="modal-btn modal-btn--cancel" style={{ marginTop: 4 }} onClick={onClose}>Batal</button>
      </div>
    </div>
  )
}

const DEFAULT_COUNTS = [33, 99, 100, 1000]

function ObjektifSetupModal({ onClose, onSave, existing }) {
  const [items, setItems] = useState(() =>
    existing && existing.length > 0
      ? existing
      : ZIKIR.map((z, i) => ({ id: i, zikirIdx: i, count: 33, enabled: false }))
  )

  const toggle = (id) => setItems(prev => prev.map(it => it.id === id ? { ...it, enabled: !it.enabled } : it))
  const setCount = (id, count) => setItems(prev => prev.map(it => it.id === id ? { ...it, count } : it))

  const enabled = items.filter(it => it.enabled)

  return (
    <div className="overlay overlay--modal obj-setup-overlay">
      <div className="obj-setup-box">
        <div className="records-header" style={{ marginBottom: 12 }}>
          <span className="records-title">Set Objektif Harian</span>
          <button className="records-close" onClick={onClose}>✕</button>
        </div>
        <p className="obj-setup-hint">Pilih zikir dan tetapkan jumlah sasaran harian anda.</p>

        <div className="obj-setup-list">
          {items.map(it => {
            const z = ZIKIR[it.zikirIdx]
            return (
              <div key={it.id} className={`obj-setup-row ${it.enabled ? 'obj-setup-row--on' : ''}`}>
                <button
                  className={`obj-check ${it.enabled ? 'obj-check--on' : ''}`}
                  onClick={() => toggle(it.id)}
                  aria-label="toggle"
                >
                  {it.enabled ? '✓' : ''}
                </button>
                <div className="obj-setup-info" onClick={() => toggle(it.id)}>
                  <span className="obj-setup-arabic">{z.arabic}</span>
                  <span className="obj-setup-latin">{z.latin}</span>
                </div>
                {it.enabled && (
                  <div className="obj-count-chips">
                    {DEFAULT_COUNTS.map(n => (
                      <button
                        key={n}
                        className={`obj-chip ${it.count === n ? 'obj-chip--on' : ''}`}
                        onClick={e => { e.stopPropagation(); setCount(it.id, n) }}
                      >{n}</button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>Batal</button>
          <button
            className="setup-start-btn"
            style={{ flex: 1 }}
            disabled={enabled.length === 0}
            onClick={() => onSave(items)}
          >
            Simpan Objektif
          </button>
        </div>
      </div>
    </div>
  )
}

function ObjektifView({ onClose, onStartZikir }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [showSetup, setShowSetup] = useState(false)
  const [objectives, setObjectives] = useState(() => {
    const saved = localStorage.getItem('zikir_objectives')
    return saved ? JSON.parse(saved) : []
  })
  const [progress, setProgress] = useState(() => {
    const key = `zikir_obj_progress_${todayStr}`
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : {}
  })

  const enabledObj = objectives.filter(it => it.enabled)

  const getProgress = (obj) => {
    const sessions = JSON.parse(localStorage.getItem('zikir_sessions') || '[]')
    const zikirName = ZIKIR[obj.zikirIdx].latin
    const todaySessions = sessions.filter(s => s.date === todayStr && s.zikir === zikirName)
    return todaySessions.reduce((sum, s) => sum + s.total, 0)
  }

  const handleSave = (items) => {
    setObjectives(items)
    localStorage.setItem('zikir_objectives', JSON.stringify(items))
    setShowSetup(false)
  }

  const handleStart = (obj) => {
    onClose()
    onStartZikir(obj.zikirIdx, obj.count)
  }

  return (
    <>
      <div className="overlay overlay--modal records-overlay">
        <div className="records-box">
          <div className="records-header">
            <span className="records-title">Objektif Harian</span>
            <button className="records-close" onClick={onClose}>✕</button>
          </div>

          <div className="obj-date-label">
            {new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {enabledObj.length === 0 ? (
            <div className="records-empty" style={{ padding: '32px 0' }}>
              Tiada objektif ditetapkan.<br />
              <span style={{ fontSize: '0.82rem', color: '#7a6030', marginTop: 6, display: 'block' }}>
                Tekan "Set Objektif" untuk mulakan.
              </span>
            </div>
          ) : (
            <div className="obj-list">
              {enabledObj.map(obj => {
                const done = getProgress(obj)
                const pct = Math.min(1, done / obj.count)
                const complete = done >= obj.count
                const z = ZIKIR[obj.zikirIdx]
                return (
                  <button
                    key={obj.id}
                    className={`obj-card ${complete ? 'obj-card--done' : ''}`}
                    onClick={() => !complete && handleStart(obj)}
                  >
                    <div className="obj-card-top">
                      <div className="obj-card-text">
                        <span className="obj-card-arabic">{z.arabic}</span>
                        <span className="obj-card-latin">{z.latin}</span>
                      </div>
                      <div className="obj-card-status">
                        {complete
                          ? <span className="obj-done-badge">✓ Selesai</span>
                          : <span className="obj-tap-hint">Ketuk untuk mulakan →</span>
                        }
                      </div>
                    </div>
                    <div className="obj-progress-bar-wrap">
                      <div className="obj-progress-bar">
                        <div className="obj-progress-fill" style={{ width: `${pct * 100}%` }} />
                      </div>
                      <span className="obj-progress-label">{done.toLocaleString()} / {obj.count.toLocaleString()}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <button
            className="setup-start-btn"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => setShowSetup(true)}
          >
            ✎ Set Objektif
          </button>
        </div>
      </div>

      {showSetup && (
        <ObjektifSetupModal
          onClose={() => setShowSetup(false)}
          onSave={handleSave}
          existing={objectives}
        />
      )}
    </>
  )
}

function AppearancePicker({ currentTheme, onSelectTheme, currentBead, onSelectBead, onClose }) {
  return (
    <div className="overlay overlay--modal picker-overlay">
      <div className="picker-box" style={{ gap: '14px' }}>
        <div className="picker-header">
          <span className="picker-title">Penampilan</span>
          <button className="records-close" onClick={onClose}>✕</button>
        </div>

        <div className="appearance-section-title">Tema Latar</div>
        <div className="picker-grid">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={`picker-card${currentTheme === t.id ? ' picker-card--active' : ''}`}
              onClick={() => onSelectTheme(t.id)}
            >
              <span className="picker-swatch" style={{ background: t.swatch }} />
              <span className="picker-label">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="appearance-divider" />

        <div className="appearance-section-title">Jenis Tasbih</div>
        <div className="picker-grid">
          {BEAD_TYPES.map(b => (
            <button
              key={b.id}
              className={`picker-card${currentBead === b.id ? ' picker-card--active' : ''}`}
              onClick={() => onSelectBead(b.id)}
            >
              <span className="picker-swatch" style={{ background: b.swatch }} />
              <span className="picker-label">{b.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const RING_R    = 60
const RING_CIRC = 2 * Math.PI * RING_R

const ProgressRing = memo(function ProgressRing({ count, targetCount }) {
  const filled = (count / targetCount) * RING_CIRC
  return (
    <svg className="progress-ring" viewBox="0 0 132 132" aria-hidden="true">
      <circle cx="66" cy="66" r={RING_R} className="progress-ring__track" />
      <circle cx="66" cy="66" r={RING_R}
        className="progress-ring__fill"
        strokeDasharray={`${filled} ${RING_CIRC}`}
        transform="rotate(-90 66 66)"
      />
    </svg>
  )
})

const Bead = memo(function Bead({ fromCounter, isBottom, isKubah }) {
  const opacity   = isKubah ? Math.max(0.25, 1 - fromCounter * 0.14) : Math.max(0.15, 1 - fromCounter * 0.17)
  const scale     = isKubah ? Math.max(0.72, 1 - fromCounter * 0.05) : Math.max(0.68, 1 - fromCounter * 0.065)
  const margin    = fromCounter === 0 ? 3 : (isKubah ? -10 : -15)
  const showHoles = fromCounter === 0

  let className = 'bead'
  if (isKubah) {
    className += ' bead--kubah'
  } else if (fromCounter > 0) {
    className += ' bead--dim'
  }

  const transform = `scale(${scale})${isKubah && isBottom ? ' rotate(180deg)' : ''}`

  return (
    <div
      className={className}
      style={{
        opacity,
        transform,
        [isBottom ? 'marginTop' : 'marginBottom']: margin,
        zIndex: 10 - fromCounter,
      }}
    >
      <div className="bead__shine" />
      {showHoles && !isBottom && <div className="bead__hole bead__hole--bot" />}
      {showHoles && !isKubah && isBottom && <div className="bead__hole bead__hole--top" />}
    </div>
  )
})

export default function App() {
  const [count,     setCount]     = useState(0)
  const [total,     setTotal]     = useState(0)
  const [animating, setAnimating] = useState(false)
  const [animKey,   setAnimKey]   = useState(0)
  const [flash,     setFlash]     = useState(false)
  const [roundDone, setRoundDone] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [targetCount, setTargetCount] = useState(33)
  const [selectedZikirIdx, setSelectedZikirIdx] = useState(0)
  const [isSetupMode, setIsSetupMode] = useState(false)
  const [showRecords, setShowRecords] = useState(false)
  const [showZikirPicker, setShowZikirPicker] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [customZikirText, setCustomZikirText] = useState('')
  const [customCountText, setCustomCountText] = useState('')
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('tasbih_theme') || 'cendana')
  const [selectedBead,  setSelectedBead]  = useState(() => localStorage.getItem('tasbih_bead')  || 'kayu')
  const [showAppearancePicker, setShowAppearancePicker] = useState(false)
  const [showObjectives, setShowObjectives] = useState(false)
  const [showMenu, setShowMenu] = useState(true)
  const [isWallpaperMode, setIsWallpaperMode] = useState(false) // Dimatikan sementara

  const countRef    = useRef(0)
  const sessionIdRef   = useRef(null)
  const sessionDateRef = useRef(null)
  const animRef     = useRef(false)
  const countAtAnim = useRef(0)

  const touchY = useRef(null)
  const touchX = useRef(null)

  const zikir = selectedZikirIdx === -1
    ? { arabic: '', latin: customZikirText || '—' }
    : ZIKIR[selectedZikirIdx]

  useEffect(() => { localStorage.setItem('tasbih_theme', selectedTheme) }, [selectedTheme])
  useEffect(() => { localStorage.setItem('tasbih_bead',  selectedBead)  }, [selectedBead])
  useEffect(() => { localStorage.setItem('tasbih_wallpaper', isWallpaperMode) }, [isWallpaperMode])

  useEffect(() => {
    if (!sessionIdRef.current || total === 0) return
    const zikirName = selectedZikirIdx === -1 ? customZikirText : ZIKIR[selectedZikirIdx].latin
    const all = JSON.parse(localStorage.getItem('zikir_sessions') || '[]')
    const idx = all.findIndex(s => s.id === sessionIdRef.current)
    const entry = { id: sessionIdRef.current, date: sessionDateRef.current, zikir: zikirName, total }
    if (idx >= 0) all[idx] = entry
    else all.push(entry)
    localStorage.setItem('zikir_sessions', JSON.stringify(all))
  }, [total, selectedZikirIdx, customZikirText])

  const showKubahBot       = count < MAX_VISIBLE
  const kubahBotIdx        = count
  const showKubahTop       = count >= targetCount - MAX_VISIBLE && count < targetCount
  const kubahTopFromCounter = targetCount - count - 1
  const kubahTopIdx        = MAX_VISIBLE - 1 - kubahTopFromCounter

  const triggerCount = useCallback(() => {
    if (animRef.current || countRef.current >= targetCount) return

    if (navigator.vibrate) {
      setTimeout(() => navigator.vibrate(22), 0)
    }

    countAtAnim.current = countRef.current
    animRef.current = true

    const next = countRef.current + 1
    if (next >= targetCount) {
      countRef.current = targetCount
      setCount(targetCount)
      setFlash(true)
      setRoundDone(true)
      if (navigator.vibrate) setTimeout(() => navigator.vibrate([100, 80, 100]), 0)
      setTimeout(() => {
        countRef.current = 0
        setFlash(false)
        setRoundDone(false)
        setCount(0)
        setSessionStarted(false)
        setShowMenu(true)
      }, 1500)
    } else {
      countRef.current = next
      setCount(next)
    }
    setTotal(t => t + 1)
    setAnimKey(k => k + 1)
    setAnimating(true)

    setTimeout(() => {
      animRef.current = false
      setAnimating(false)
    }, 520)
  }, [targetCount])

  const onPointerDown = useCallback(e => {
    // Kita gunakan clientY/clientX terus dari event (berfungsi untuk tetikus & jari)
    touchY.current = e.clientY
    touchX.current = e.clientX

    // (Pilihan) Set capture supaya seretan laju ke luar skrin tidak terlepas
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId)
    }
  }, [])

  const onPointerMove = useCallback(e => {
    if (touchY.current === null || isSetupMode || showZikirPicker) return
    const dy = e.clientY - touchY.current
    const dx = Math.abs(e.clientX - touchX.current)

    if (dy > 34 && dx < 52) {
      touchY.current = null // reset supaya tidak trigger berkali-kali
      triggerCount()
    }
  }, [triggerCount, isSetupMode, showZikirPicker])

  const onPointerUp = useCallback(e => {
    touchY.current = null
    touchX.current = null

    if (e && e.target.releasePointerCapture) {
      e.target.releasePointerCapture(e.pointerId)
    }
  }, [])

  const onResetClick = useCallback(() => {
    countRef.current = 0
    animRef.current  = false
    sessionIdRef.current   = null
    sessionDateRef.current = null
    setCount(0)
    setTotal(0)
    setAnimating(false)
    setFlash(false)
    setRoundDone(false)
    setSessionStarted(false)
    setShowRecords(false)
    setShowMenu(true)
  }, [])

  const confirmReset = useCallback(e => {
    if (e) e.stopPropagation()
    countRef.current = 0
    animRef.current  = false
    sessionIdRef.current   = null
    sessionDateRef.current = null
    setCount(0)
    setTotal(0)
    setAnimating(false)
    setFlash(false)
    setRoundDone(false)
    setSessionStarted(false)
    setShowResetModal(false)
    setShowMenu(true)
  }, [])

  const cancelReset = useCallback(e => {
    if (e) e.stopPropagation()
    setShowResetModal(false)
  }, [])

  const startFromObjectif = useCallback((zikirIdx, targetCount) => {
    const todayStr = new Date().toISOString().split('T')[0]
    const zikirName = ZIKIR[zikirIdx].latin

    // Kira progress hari ini untuk zikir ini
    const sessions = JSON.parse(localStorage.getItem('zikir_sessions') || '[]')
    const todayDone = sessions
      .filter(s => s.date === todayStr && s.zikir === zikirName)
      .reduce((sum, s) => sum + s.total, 0)

    // Resume dari bilangan yang dah dicapai (modulo targetCount)
    const resumeCount = todayDone % targetCount

    setSelectedZikirIdx(zikirIdx)
    setTargetCount(targetCount)
    setCustomZikirText('')
    setCustomCountText('')
    sessionIdRef.current   = Date.now()
    sessionDateRef.current = todayStr
    countRef.current = resumeCount
    animRef.current  = false
    setCount(resumeCount)
    setTotal(0)
    setFlash(false)
    setRoundDone(false)
    setSessionStarted(true)
    setIsSetupMode(false)
    setShowObjectives(false)
  }, [])

  const switchZikir = useCallback(idx => {
    sessionIdRef.current   = Date.now()
    sessionDateRef.current = new Date().toISOString().split('T')[0]
    countRef.current = 0
    animRef.current  = false
    setCount(0)
    setTotal(0)
    setFlash(false)
    setRoundDone(false)
    setSelectedZikirIdx(idx)
    setShowZikirPicker(false)
  }, [])

  return (
    <div
      className={`app theme-${selectedTheme} beads-${selectedBead}${flash ? ' app--flash' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* <DynamicWallpaper isVisible={isWallpaperMode} /> */}
      <div className={`wood-grain ${isWallpaperMode ? 'wood-grain--hidden' : ''}`} />

      {/* ── Wallpaper Toggle Button (Disembunyikan) ── */}
      {/* <button
        className={`wallpaper-btn ${isWallpaperMode ? 'wallpaper-btn--active' : ''}`}
        onClick={e => { e.stopPropagation(); setIsWallpaperMode(w => !w) }}
      >
        🖼️
      </button>
      */}

      {/* ── Header ── */}
      {sessionStarted && (
      <header className={`header ${isWallpaperMode ? 'header--wallpaper-mode' : ''} ${animating ? 'header--pulse' : ''}`}>
        {zikir.arabic && <div className="zikir-arabic">{zikir.arabic}</div>}
        <div className="zikir-latin">{zikir.latin}</div>
      </header>
      )}

      {/* ── Tasbih ── */}
      {sessionStarted && (
      <div className={`tasbih ${isWallpaperMode ? 'tasbih--wallpaper-mode' : ''}`}>
        <div className="cluster cluster--top">
          {Array.from({ length: MAX_VISIBLE }, (_, i) => {
            const fromCounter = MAX_VISIBLE - 1 - i
            const isKubah = showKubahTop && i === kubahTopIdx
            return <Bead key={i} fromCounter={fromCounter} isBottom={false} isKubah={isKubah} />
          })}
        </div>

        {/* Latar Belakang Buah Imam */}
        <div className="counter-wrap">
          <div className="counter">
            <div className="counter-shine" />
          </div>
        </div>

        {/* Animasi Buah Imam */}
        {animating && (
          <>
            <div key={`gi-${animKey}`} className="anim-imam">
              <div className="counter-shine" />
              {/* Teks telah dibuang dari sini supaya tidak ikut jatuh */}
            </div>
            <div key={`rb-${animKey}`} className="anim-replace">
              <div className="bead__shine" />
            </div>
          </>
        )}

        {/* Teks Counter & Progress Ring */}
        <div className="counter-wrap" style={{ zIndex: 20 }}>
          <ProgressRing count={count} targetCount={targetCount} />
          <div className="counter-text-overlay">
            <span className="counter__num">{count}</span>
            <span className="counter__frac">{targetCount} biji</span>
          </div>
        </div>

        <div className="cluster cluster--bot">
          {Array.from({ length: MAX_VISIBLE }, (_, i) => {
            const isKubah = showKubahBot && i === kubahBotIdx
            return <Bead key={i} fromCounter={i} isBottom={true} isKubah={isKubah} />
          })}
        </div>
      </div>
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        <button
          className="menu-btn"
          onClick={e => { e.stopPropagation(); setShowMenu(m => !m) }}
        >
          ☰ Menu
        </button>
        <div className="hint">
          <span className="hint__arrow">↓</span> swipe down to count
        </div>
      </footer>

      {/* ── Popup Menu ── */}
      {showMenu && (
        <div
          className="menu-backdrop"
          onClick={e => { e.stopPropagation(); if (sessionStarted) setShowMenu(false) }}
        >
          <div className="menu-popup" onClick={e => e.stopPropagation()}>
            <div className="menu-popup-title">Menu</div>
            <button className="menu-item" onClick={e => { e.stopPropagation(); setShowMenu(false); setIsSetupMode(true) }}>
              <span className="menu-item-icon">📿</span>
              <span>Pilih Zikir</span>
            </button>
            <button className="menu-item" onClick={e => { e.stopPropagation(); setShowMenu(false); setShowObjectives(true) }}>
              <span className="menu-item-icon">🎯</span>
              <span>Objektif Harian</span>
            </button>
            <button className="menu-item" onClick={e => { e.stopPropagation(); setShowMenu(false); setShowRecords(true) }}>
              <span className="menu-item-icon">📊</span>
              <span>Rekod</span>
            </button>
            <button className="menu-item" onClick={e => { e.stopPropagation(); setShowMenu(false); setShowAppearancePicker(true) }}>
              <span className="menu-item-icon">🎨</span>
              <span>Penampilan</span>
            </button>
            {sessionStarted && (
              <button className="menu-item menu-item--close" onClick={e => { e.stopPropagation(); setShowMenu(false) }}>
                Tutup
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Round-complete overlay ── */}
      {roundDone && (
        <div className="overlay">
          <div className="overlay__star">✦</div>
          <div className="overlay__title">{zikir.arabic}</div>
          <div className="overlay__sub">33 selesai</div>
        </div>
      )}

      {/* ── Reset Confirmation Modal ── */}
      {showResetModal && (
        <div className="overlay overlay--modal">
          <div className="modal-box">
            <div className="modal-title">Reset Kaunter</div>
            <div className="modal-desc">
              Jumlah zikir keseluruhan ({total}) akan dipadam. Anda pasti?
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--cancel" onClick={cancelReset}>Batal</button>
              <button className="modal-btn modal-btn--confirm" onClick={confirmReset}>Ya, Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Records Overlay ── */}
      {showRecords && (
        <RecordsView
          onClose={() => setShowRecords(false)}
          onReset={onResetClick}
        />
      )}

      {/* ── Tukar Zikir Picker ── */}
      {showZikirPicker && (
        <ZikirPicker
          current={selectedZikirIdx}
          onSelect={switchZikir}
          onClose={() => setShowZikirPicker(false)}
        />
      )}

      {/* ── Setup / Pre-start Overlay ── */}
      {isSetupMode && (
        <div className="overlay setup-overlay">
          <div className="setup-box">
            <div className="setup-title">Pilih Zikir</div>

            <div className="setup-columns">
              <div className="setup-col">
                <div className="setup-col-title">Zikir</div>
                <div className="setup-col-list">
                  {ZIKIR.map((z, idx) => (
                    <button
                      key={idx}
                      className={`setup-opt ${selectedZikirIdx === idx ? 'setup-opt--active' : ''}`}
                      onClick={() => { setSelectedZikirIdx(idx); setCustomZikirText('') }}
                    >
                      {z.latin}
                    </button>
                  ))}
                  <input
                    className={`setup-custom-input ${selectedZikirIdx === -1 ? 'setup-custom-input--active' : ''}`}
                    placeholder="Zikir lain..."
                    value={customZikirText}
                    onChange={e => { setCustomZikirText(e.target.value); setSelectedZikirIdx(-1) }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="setup-col">
                <div className="setup-col-title">Jumlah</div>
                <div className="setup-col-list">
                  {[33, 99, 100, 1000, 70000].map(num => (
                    <button
                      key={num}
                      className={`setup-opt ${targetCount === num && customCountText === '' ? 'setup-opt--active' : ''}`}
                      onClick={() => { setTargetCount(num); setCustomCountText('') }}
                    >
                      {num === 70000 ? '70,000' : num}x
                    </button>
                  ))}
                  <input
                    className={`setup-custom-input ${customCountText !== '' ? 'setup-custom-input--active' : ''}`}
                    placeholder="Jumlah lain..."
                    inputMode="numeric"
                    value={customCountText}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      setCustomCountText(val)
                      if (val && parseInt(val) > 0) setTargetCount(parseInt(val))
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>

            <div className="setup-actions">
              {sessionStarted && (
                <button className="modal-btn modal-btn--cancel" onClick={() => setIsSetupMode(false)}>Batal</button>
              )}
              <button
                className="setup-start-btn"
                disabled={selectedZikirIdx === -1 && !customZikirText.trim()}
                onClick={() => {
                  sessionIdRef.current   = Date.now()
                  sessionDateRef.current = new Date().toISOString().split('T')[0]
                  countRef.current = 0
                  animRef.current  = false
                  setCount(0)
                  setTotal(0)
                  setFlash(false)
                  setRoundDone(false)
                  setSessionStarted(true)
                  setIsSetupMode(false)
                }}>
                {sessionStarted ? 'Pilih' : 'Mula Zikir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Objectives Overlay ── */}
      {showObjectives && (
        <ObjektifView
          onClose={() => setShowObjectives(false)}
          onStartZikir={startFromObjectif}
        />
      )}

      {/* ── Appearance Picker (Tema & Tasbih) ── */}
      {showAppearancePicker && (
        <AppearancePicker
          currentTheme={selectedTheme}
          onSelectTheme={setSelectedTheme}
          currentBead={selectedBead}
          onSelectBead={setSelectedBead}
          onClose={() => setShowAppearancePicker(false)}
        />
      )}
    </div>
  )
}