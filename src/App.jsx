// SmartBiz News Desk — v6
// Full Auto | Schedule | Real News | Auto Image | Sinhala Only

import { useState, useEffect, useCallback, useRef } from 'react'
import { runPipeline } from './pipeline'
import { supabase } from './supabase'
import ImageGenerator from './components/ImageGenerator'

// ── Constants ──────────────────────────────────────────────────────────────
const AGENTS = [
  { id: 1, icon: '🔍', name: 'News Hunter',    desc: 'Real web search' },
  { id: 2, icon: '✍️',  name: 'Sinhala Writer', desc: 'Sinhala article' },
  { id: 3, icon: '📱', name: 'Social Media',   desc: 'FB · WA · Push' },
  { id: 4, icon: '🎨', name: 'Image AI',       desc: 'Auto generate' },
]

const QUICK_TOPICS = ['AI', 'Space', 'ලංකා SL', 'Crypto', 'EV', 'Health', 'Climate', 'Viral']

const DEFAULT_SCHEDULE = [
  { id: 1, topic: 'Artificial Intelligence',  time: '08:00', active: true  },
  { id: 2, topic: 'Space Technology',         time: '12:00', active: true  },
  { id: 3, topic: 'Sri Lanka Tech News',      time: '18:00', active: false },
  { id: 4, topic: 'Global Business',          time: '20:00', active: false },
]

const TABS = [
  { id: 'GENERATE', icon: '⚡', label: 'GENERATE' },
  { id: 'ARTICLE',  icon: '📄', label: 'ARTICLE'  },
  { id: 'SOCIAL',   icon: '📱', label: 'SOCIAL'   },
  { id: 'AUTO',     icon: '🤖', label: 'AUTO'     },
  { id: 'HISTORY',  icon: '🕐', label: 'HISTORY'  },
]

// ── Theme ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '#050508',
  surface: '#0a0a10',
  border:  'rgba(255,255,255,0.06)',
  text:    '#e0e0f0',
  muted:   '#44446a',
  red:     '#e03030',
  green:   '#22c55e',
  blue:    '#4a9eff',
}

const S = {
  app: {
    fontFamily: "'Syne','Noto Sans Sinhala',sans-serif",
    background: C.bg, minHeight: '100vh', color: C.text,
    maxWidth: 480, margin: '0 auto',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: `1px solid ${C.border}`,
    position: 'sticky', top: 0, zIndex: 99,
    background: 'rgba(5,5,8,0.96)', backdropFilter: 'blur(12px)',
  },
  tabs: {
    display: 'flex', borderBottom: `1px solid ${C.border}`,
    position: 'sticky', top: 57, zIndex: 98,
    background: 'rgba(5,5,8,0.96)', backdropFilter: 'blur(12px)',
    overflowX: 'auto', scrollbarWidth: 'none',
  },
  tab: a => ({
    flex: 1, minWidth: 56, padding: '10px 4px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    cursor: 'pointer', border: 'none', background: 'transparent',
    color: a ? C.red : C.muted,
    borderBottom: `2px solid ${a ? C.red : 'transparent'}`,
    fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
    fontFamily: 'inherit', transition: 'all 0.15s',
  }),
  body:  { padding: '16px 16px 100px' },
  label: { fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, marginBottom: 6, display: 'block' },
  input: {
    width: '100%', background: C.surface,
    border: `1.5px solid ${C.border}`,
    borderRadius: 12, padding: '12px 14px',
    color: C.text, fontSize: 14, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  },
  chip: a => ({
    padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
    border: `1.5px solid ${a ? C.red : C.border}`,
    background: a ? 'rgba(224,48,48,0.1)' : 'transparent',
    color: a ? C.red : '#666688',
    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
  }),
  btn: (v='red', dis=false) => ({
    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
    cursor: dis ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: dis ? 0.45 : 1, transition: 'opacity 0.15s',
    ...(v==='red'   && { background: C.red,   color: '#fff' }),
    ...(v==='green' && { background: C.green, color: '#fff' }),
    ...(v==='ghost' && { background: 'rgba(255,255,255,0.04)', color: '#8888a0', border: `1.5px solid ${C.border}` }),
    ...(v==='blue'  && { background: 'rgba(74,158,255,0.12)', color: C.blue, border: `1.5px solid rgba(74,158,255,0.25)` }),
  }),
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 14, overflow: 'hidden', marginBottom: 12,
  },
  cardHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderBottom: `1px solid rgba(255,255,255,0.04)`,
    background: 'rgba(255,255,255,0.02)',
  },
  cardBody: { padding: '12px 14px' },
  si: { fontFamily: "'Noto Sans Sinhala',sans-serif", fontSize: 14, lineHeight: 1.75, color: '#c8c8e0', whiteSpace: 'pre-wrap' },
  tag: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#666688', fontSize: 10, fontWeight: 600, marginRight: 5, marginBottom: 5 },
  err: { background: 'rgba(224,48,48,0.08)', border: `1px solid rgba(224,48,48,0.2)`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#ff7070', marginBottom: 12 },
}

// ── Helpers ────────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [ok, set] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); set(true); setTimeout(()=>set(false),1500) }}
      style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: 'none', color: ok?C.green:'#666688', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
      {ok ? '✓ Copied' : '⎘ Copy'}
    </button>
  )
}

function Card({ label, extra, children }) {
  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>{label}</span>
        {extra}
      </div>
      <div style={S.cardBody}>{children}</div>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? C.green : '#222230', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 21 : 3, transition: 'left 0.2s' }} />
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [tab,       setTab]       = useState('GENERATE')
  const [topic,     setTopic]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [result,    setResult]    = useState(null)
  const [agents,    setAgents]    = useState({})
  const [history,   setHistory]   = useState([])
  const [schedule,  setSchedule]  = useState(DEFAULT_SCHEDULE)
  const [autoOn,    setAutoOn]    = useState(false)
  const [autoLog,   setAutoLog]   = useState([])
  const [autoRunning, setAutoRunning] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('sb_schedule')
    if (saved) setSchedule(JSON.parse(saved))
    const savedAuto = localStorage.getItem('sb_auto')
    if (savedAuto) setAutoOn(JSON.parse(savedAuto))
    supabase?.from('articles').select('*').order('created_at',{ascending:false}).limit(20)
      .then(({data}) => data && setHistory(data))
  }, [])

  useEffect(() => {
    localStorage.setItem('sb_schedule', JSON.stringify(schedule))
  }, [schedule])

  useEffect(() => {
    localStorage.setItem('sb_auto', JSON.stringify(autoOn))
  }, [autoOn])

  // ── Auto scheduler tick every 60s ─────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoOn) return
    timerRef.current = setInterval(async () => {
      const now   = new Date()
      const hhmm  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      const due   = schedule.find(s => s.active && s.time === hhmm)
      if (!due || autoRunning) return
      setAutoRunning(true)
      setAutoLog(l => [`🕐 ${hhmm} — Starting: ${due.topic}`, ...l.slice(0,19)])
      try {
        const payload = await runPipeline(due.topic, 'trending', (id, state, msg) => {
          if (state === 'done') setAutoLog(l => [`  ✓ Agent ${id}: ${msg}`, ...l.slice(0,19)])
        })
        if (supabase) {
          await supabase.from('articles').insert([{ ...payload, topic: due.topic }])
        }
        setHistory(h => [{ ...payload, topic: due.topic, created_at: new Date().toISOString() }, ...h.slice(0,19)])
        setAutoLog(l => [`✅ Done: "${payload.headline_si}"`, ...l.slice(0,19)])
      } catch(e) {
        setAutoLog(l => [`❌ Error: ${e.message.slice(0,60)}`, ...l.slice(0,19)])
      } finally {
        setAutoRunning(false)
      }
    }, 60000)
    return () => clearInterval(timerRef.current)
  }, [autoOn, schedule, autoRunning])

  const onAgent = useCallback((id, state, msg) => {
    setAgents(prev => ({ ...prev, [id]: { state, msg } }))
  }, [])

  async function generate(topicOverride) {
    const t = (topicOverride || topic).trim()
    if (!t) return
    setError(''); setResult(null); setAgents({}); setLoading(true)
    try {
      const payload = await runPipeline(t, 'trending', onAgent)
      setResult(payload)
      if (supabase) {
        const { error: e } = await supabase.from('articles').insert([{ ...payload, topic: t }])
        if (!e) setHistory(h => [{ ...payload, topic: t, created_at: new Date().toISOString() }, ...h.slice(0,19)])
      }
      setTab('ARTICLE')
    } catch(e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── TAB: GENERATE ──────────────────────────────────────────────────────
  function TabGenerate() {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>News Desk</h2>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>4 AI agents · Real news · Auto image · Sinhala</p>
        </div>

        <label style={S.label}>TOPIC</label>
        <input style={S.input} placeholder="Type your topic..." value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key==='Enter' && !loading && generate()} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 16 }}>
          {QUICK_TOPICS.map(t => (
            <button key={t} style={S.chip(topic===t)} onClick={() => setTopic(t)}>{t}</button>
          ))}
        </div>

        {/* Agent grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {AGENTS.map(a => {
            const ag = agents[a.id] || {}
            const isRun  = ag.state === 'run'
            const isDone = ag.state === 'done'
            return (
              <div key={a.id} style={{
                background: isDone ? 'rgba(34,197,94,0.06)' : isRun ? 'rgba(224,48,48,0.08)' : C.surface,
                border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : isRun ? 'rgba(224,48,48,0.25)' : C.border}`,
                borderRadius: 12, padding: '10px 12px', transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 16 }}>{a.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c0c0d8' }}>{a.name}</span>
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{a.desc}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: isDone ? C.green : isRun ? C.red : '#333355', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {isRun && <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>◌</span>}
                  {isDone && '✓ '}{ag.msg || 'Waiting...'}
                </div>
              </div>
            )
          })}
        </div>

        {error && <div style={S.err}>⚠️ {error}</div>}
        <button style={S.btn('red', loading || !topic.trim())} onClick={() => generate()} disabled={loading || !topic.trim()}>
          {loading ? '⏳ Generating...' : '⚡ Generate Article'}
        </button>
      </div>
    )
  }

  // ── TAB: ARTICLE ───────────────────────────────────────────────────────
  function TabArticle() {
    if (!result) return <div style={{ textAlign:'center', padding:40, color:'#333355' }}>Generate an article first ⚡</div>
    return (
      <div>
        <Card label="📰 Sinhala Headline" extra={<CopyBtn text={result.headline_si} />}>
          <div style={{ fontFamily:"'Noto Sans Sinhala',sans-serif", fontSize:16, fontWeight:700, lineHeight:1.5 }}>
            {result.headline_si}
          </div>
        </Card>

        <Card label="🌐 Source & English Headline">
          <div style={{ fontSize:14, fontWeight:600, color:'#c0c0d8', marginBottom:10 }}>{result.headline_en}</div>
          {result.source_url ? (
            <a href={result.source_url} target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:C.blue, background:'rgba(74,158,255,0.08)', border:'1px solid rgba(74,158,255,0.2)', borderRadius:20, padding:'5px 14px', textDecoration:'none' }}>
              🔗 {result.source_name} — Original Article ↗
            </a>
          ) : (
            <span style={{ fontSize:11, color:'#444466' }}>📰 {result.source_name || 'Source unavailable'}</span>
          )}
        </Card>

        <Card label="📝 Sinhala Article" extra={<CopyBtn text={result.article_si} />}>
          <div style={S.si}>{result.article_si}</div>
        </Card>

        {/* Auto image — loads automatically */}
        <Card label="🖼️ AI Image — Auto Generated">
          <AutoImage prompt={result.image_prompt} headline={result.headline_si} imageUrl={result.image_url} />
        </Card>

        <Card label="📊 Stats">
          <div style={{ fontSize:11, color:'#666688', marginBottom:4 }}>Virality: {result.virality}/10</div>
          <div style={{ height:4, borderRadius:4, background:`linear-gradient(90deg,${C.red} ${result.virality*10}%,rgba(255,255,255,0.05) ${result.virality*10}%)`, marginBottom:10 }} />
          <div>{result.tags?.map(t => <span key={t} style={S.tag}>#{t}</span>)}</div>
        </Card>
      </div>
    )
  }

  // ── TAB: SOCIAL ────────────────────────────────────────────────────────
  function TabSocial() {
    if (!result) return <div style={{ textAlign:'center', padding:40, color:'#333355' }}>Generate an article first ⚡</div>
    return (
      <div>
        <Card label="📘 Facebook" extra={<CopyBtn text={result.facebook} />}>
          <div style={S.si}>{result.facebook}</div>
        </Card>
        <Card label="💚 WhatsApp" extra={<CopyBtn text={result.whatsapp} />}>
          <div style={S.si}>{result.whatsapp}</div>
        </Card>
        <Card label="🔔 Push Notification" extra={<CopyBtn text={result.push} />}>
          <div style={{ fontFamily:"'Noto Sans Sinhala',sans-serif", fontSize:13, color:'#c8c8e0' }}>{result.push}</div>
        </Card>
        <Card label="🔍 Meta Description" extra={<CopyBtn text={result.meta_desc} />}>
          <div style={{ fontSize:12, color:'#888890' }}>{result.meta_desc}</div>
        </Card>
      </div>
    )
  }

  // ── TAB: AUTO ──────────────────────────────────────────────────────────
  function TabAuto() {
    const [newTopic, setNewTopic] = useState('')
    const [newTime,  setNewTime]  = useState('09:00')

    function addSlot() {
      if (!newTopic.trim()) return
      setSchedule(s => [...s, { id: Date.now(), topic: newTopic.trim(), time: newTime, active: true }])
      setNewTopic('')
    }

    function removeSlot(id) {
      setSchedule(s => s.filter(x => x.id !== id))
    }

    function toggleSlot(id) {
      setSchedule(s => s.map(x => x.id === id ? { ...x, active: !x.active } : x))
    }

    return (
      <div>
        {/* Auto mode master toggle */}
        <div style={{ ...S.card, marginBottom: 12 }}>
          <div style={{ ...S.cardBody, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>🤖 Auto Mode</div>
              <div style={{ fontSize:11, color: autoOn ? C.green : C.muted }}>
                {autoOn ? (autoRunning ? '⏳ Running now...' : '✅ Active — checks every minute') : 'Off — turn on to schedule'}
              </div>
            </div>
            <Toggle on={autoOn} onChange={setAutoOn} />
          </div>
        </div>

        {/* Schedule list */}
        <label style={S.label}>SCHEDULE</label>
        {schedule.map(s => (
          <div key={s.id} style={{ ...S.card, marginBottom: 8 }}>
            <div style={{ ...S.cardBody, display:'flex', alignItems:'center', gap: 10 }}>
              <div style={{ fontSize:14, fontWeight:700, color: C.blue, minWidth:40 }}>{s.time}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#c0c0d8' }}>{s.topic}</div>
                <div style={{ fontSize:10, color: s.active ? C.green : C.muted }}>{s.active ? 'Active' : 'Paused'}</div>
              </div>
              <Toggle on={s.active} onChange={() => toggleSlot(s.id)} />
              <button onClick={() => runPipeline && generate(s.topic)}
                style={{ fontSize:10, padding:'4px 10px', borderRadius:20, background:'rgba(224,48,48,0.1)', border:`1px solid rgba(224,48,48,0.2)`, color:C.red, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                ▶ Run
              </button>
              <button onClick={() => removeSlot(s.id)}
                style={{ fontSize:12, padding:'4px 8px', borderRadius:20, background:'transparent', border:'none', color:'#444466', cursor:'pointer' }}>
                ✕
              </button>
            </div>
          </div>
        ))}

        {/* Add new slot */}
        <div style={{ ...S.card, marginTop: 12 }}>
          <div style={{ ...S.cardHead }}>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:C.muted }}>ADD SCHEDULE</span>
          </div>
          <div style={{ ...S.cardBody, display:'flex', flexDirection:'column', gap:8 }}>
            <input style={S.input} placeholder="Topic (e.g. AI News)" value={newTopic} onChange={e => setNewTopic(e.target.value)} />
            <input style={{ ...S.input, width:'auto' }} type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
            <button style={S.btn('blue', !newTopic.trim())} onClick={addSlot} disabled={!newTopic.trim()}>
              + Add to Schedule
            </button>
          </div>
        </div>

        {/* Auto log */}
        {autoLog.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <label style={S.label}>AUTO LOG</label>
            <div style={{ background: '#080810', borderRadius: 10, padding: '10px 14px', border: `1px solid ${C.border}` }}>
              {autoLog.map((l, i) => (
                <div key={i} style={{ fontSize: 11, color: l.startsWith('✅') ? C.green : l.startsWith('❌') ? '#ff6060' : '#666688', padding: '2px 0', fontFamily: 'monospace' }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── TAB: HISTORY ───────────────────────────────────────────────────────
  function TabHistory() {
    if (!history.length) return <div style={{ textAlign:'center', padding:40, color:'#333355' }}>No history yet</div>
    return (
      <div>
        {history.map((h, i) => (
          <div key={i} style={{ ...S.card, cursor:'pointer' }} onClick={() => { setResult(h); setTab('ARTICLE') }}>
            <div style={S.cardBody}>
              <div style={{ fontFamily:"'Noto Sans Sinhala',sans-serif", fontSize:13, fontWeight:600, color:'#c0c0d8', marginBottom:4 }}>
                {h.headline_si}
              </div>
              <div style={{ fontSize:10, color:'#333355', display:'flex', gap:8, alignItems:'center' }}>
                <span>{h.topic}</span>
                <span>🔥 {h.virality}/10</span>
                {h.source_name && <span>📰 {h.source_name}</span>}
                <span>{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const TABMAP = { GENERATE: TabGenerate, ARTICLE: TabArticle, SOCIAL: TabSocial, AUTO: TabAuto, HISTORY: TabHistory }
  const Active = TABMAP[tab]

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Noto+Sans+Sinhala:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#050508}
        input:focus{border-color:rgba(224,48,48,0.4)!important;outline:none}
        input[type=time]{color-scheme:dark}
        ::-webkit-scrollbar{display:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:C.red, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900 }}>SB</div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.02em' }}>SmartBiz</div>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:'0.12em', textTransform:'uppercase' }}>News Desk · AI</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, fontWeight:700, color: autoOn ? C.green : C.muted }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: autoOn ? C.green : C.muted, display:'inline-block', animation: autoOn ? 'spin 2s linear infinite' : 'none' }} />
          {autoOn ? 'AUTO ON' : 'LIVE'}
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab===t.id)} onClick={() => setTab(t.id)}>
            <span style={{ fontSize:16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={S.body}><Active /></div>
    </div>
  )
}

// ── Auto Image Component ───────────────────────────────────────────────────
function AutoImage({ prompt, headline, imageUrl }) {
  const [status, setStatus] = useState('loading')
  const [src,    setSrc]    = useState(imageUrl)
  const [wm,     setWm]     = useState(null)

  useEffect(() => {
    if (!prompt) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setSrc(imageUrl)
      // Add watermark
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const fSize = Math.max(14, img.width * 0.022)
      const text  = '⚡ SmartBiz'
      ctx.font    = `700 ${fSize}px Syne, sans-serif`
      const tw = ctx.measureText(text).width
      const bw = tw + 24, bh = fSize + 16
      const bx = 16, by = img.height - bh - 16
      ctx.fillStyle = 'rgba(224,48,48,0.92)'
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh/2); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillText(text, bx + 12, by + bh - 8)
      setWm(canvas.toDataURL('image/jpeg', 0.92))
      setStatus('done')
    }
    img.onerror = () => setStatus('error')
    img.src = imageUrl
  }, [imageUrl])

  const download = () => {
    const a = document.createElement('a')
    a.href = wm || src; a.download = `smartbiz-${Date.now()}.jpg`; a.click()
  }

  if (status === 'loading') return (
    <div style={{ height:160, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, background:'#080810', borderRadius:10 }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(224,48,48,0.2)', borderTopColor:'#e03030', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <div style={{ fontSize:11, color:'#444466' }}>Generating image automatically...</div>
    </div>
  )

  if (status === 'error') return (
    <div style={{ textAlign:'center', padding:'20px 0', color:'#ff6060', fontSize:12 }}>⚠️ Image generation failed</div>
  )

  return (
    <div>
      <img src={wm || src} alt={headline} style={{ width:'100%', borderRadius:10, display:'block', animation:'fadeIn 0.3s ease' }} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
        <button onClick={() => { const u=new Image(); u.crossOrigin='anonymous'; u.onload=()=>{ const c=document.createElement('canvas'); c.width=u.width; c.height=u.height; const x=c.getContext('2d'); x.drawImage(u,0,0); setSrc(imageUrl.replace(/seed=\d+/,`seed=${Math.floor(Math.random()*99999)}`)); setStatus('loading'); }; u.src=imageUrl }} style={{ padding:'10px', borderRadius:10, border:`1.5px solid ${C.border}`, background:'transparent', color:'#8888a0', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>
          ↺ Regenerate
        </button>
        <button onClick={download} style={{ padding:'10px', borderRadius:10, border:'none', background:'#22c55e', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700 }}>
          ⬇ Download
        </button>
      </div>
    </div>
  )
}


