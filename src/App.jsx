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
  { id: 'rawak',   label: 'Rawak',   swatch: 'linear-gradient(45deg, #102840, #3c1828)' },
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
  const [isSetupMode, setIsSetupMode] = useState(true)
  const [showRecords, setShowRecords] = useState(false)
  const [showZikirPicker, setShowZikirPicker] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [customZikirText, setCustomZikirText] = useState('')
  const [customCountText, setCustomCountText] = useState('')
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('tasbih_theme') || 'cendana')
  const [selectedBead,  setSelectedBead]  = useState(() => localStorage.getItem('tasbih_bead')  || 'kayu')
  const [showAppearancePicker, setShowAppearancePicker] = useState(false)

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
        setIsSetupMode(true)
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

  const onTouchStart = useCallback(e => {
    touchY.current = e.touches[0].clientY
    touchX.current = e.touches[0].clientX
  }, [])

  const onTouchMove = useCallback(e => {
    if (touchY.current === null || isSetupMode || showZikirPicker) return
    const dy = e.touches[0].clientY - touchY.current
    const dx = Math.abs(e.touches[0].clientX - touchX.current)
    if (dy > 34 && dx < 52) {
      touchY.current = null
      triggerCount()
    }
  }, [triggerCount, isSetupMode, showZikirPicker])

  const onTouchEnd = useCallback(() => {
    touchY.current = null
    touchX.current = null
  }, [])

  const onResetClick = useCallback(() => {
    setShowRecords(false)
    setShowResetModal(true)
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
    setShowResetModal(false)
    setIsSetupMode(true)
  }, [])

  const cancelReset = useCallback(e => {
    if (e) e.stopPropagation()
    setShowResetModal(false)
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
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {selectedTheme === 'rawak' && <DynamicWallpaper />}
      <div className="wood-grain" />

      {/* ── Header ── */}
      <header className="header">
        {zikir.arabic && <div className="zikir-arabic">{zikir.arabic}</div>}
        <div className="zikir-latin">{zikir.latin}</div>
      </header>

      {/* ── Tasbih ── */}
      <div className="tasbih">
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
              <div className="counter-text-overlay">
                <span className="counter__num">{countAtAnim.current + 1}</span>
                <span className="counter__frac">{targetCount} biji</span>
              </div>
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

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer__row">
          <button className="tukar-btn" onClick={e => { e.stopPropagation(); setIsSetupMode(true) }}>Pilih Zikir</button>
          <button className="records-btn" onClick={e => { e.stopPropagation(); setShowRecords(true) }}>Rekod</button>
          <button className="tukar-btn icon-btn" onClick={e => { e.stopPropagation(); setShowAppearancePicker(true) }}>🎨</button>
        </div>
        <div className="hint">
          <span className="hint__arrow">↓</span> swipe down to count
        </div>
      </footer>

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
                  {[33, 100, 1000].map(num => (
                    <button
                      key={num}
                      className={`setup-opt ${targetCount === num && customCountText === '' ? 'setup-opt--active' : ''}`}
                      onClick={() => { setTargetCount(num); setCustomCountText('') }}
                    >
                      {num}x
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
