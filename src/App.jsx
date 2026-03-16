import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase.js'
import { runPipeline } from './pipeline.js'
import ImageGenerator from './components/ImageGenerator.jsx'

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  app: {
    display:'flex',flexDirection:'column',height:'100%',
    background:'var(--bg)',overflow:'hidden',
  },
  topbar: {
    flexShrink:0,
    background:'#0c0c10',
    borderBottom:'1px solid var(--border)',
    padding:'12px 16px',
    display:'flex',alignItems:'center',justifyContent:'space-between',
  },
  brandRow: { display:'flex',alignItems:'center',gap:10 },
  brandMark: {
    width:32,height:32,
    background:'linear-gradient(135deg,#e03030,#ff6b35)',
    borderRadius:8,
    display:'flex',alignItems:'center',justifyContent:'center',
    fontWeight:800,fontSize:13,color:'#fff',fontFamily:'Syne',
    boxShadow:'0 0 14px rgba(224,48,48,0.4)',
  },
  brandName: { fontWeight:800,fontSize:17,letterSpacing:'-0.3px' },
  brandSub: { fontSize:9,color:'var(--text3)',letterSpacing:'0.14em',textTransform:'uppercase',marginTop:1 },
  liveBadge: {
    display:'flex',alignItems:'center',gap:5,
    fontSize:10,fontWeight:600,color:'var(--green)',
    letterSpacing:'0.06em',textTransform:'uppercase',
  },
  liveDot: {
    width:6,height:6,borderRadius:'50%',
    background:'var(--green)',
    boxShadow:'0 0 6px var(--green)',
    animation:'pulse 2s infinite',
  },
  tabs: {
    flexShrink:0,
    display:'flex',
    background:'var(--surface)',
    borderBottom:'1px solid var(--border)',
    overflowX:'auto',scrollbarWidth:'none',
  },
  tab: (active) => ({
    flex:1,minWidth:64,padding:'10px 6px',
    display:'flex',flexDirection:'column',alignItems:'center',gap:2,
    border:'none',background:'transparent',
    color: active ? 'var(--text)' : 'var(--text3)',
    fontFamily:'Syne',fontSize:10,fontWeight:600,
    letterSpacing:'0.06em',textTransform:'uppercase',
    cursor:'pointer',
    borderBottom: active ? '2px solid var(--red)' : '2px solid transparent',
    transition:'all 0.15s',
  }),
  tabIcon: { fontSize:15 },
  main: { flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' },
  screen: { padding:'16px 16px 100px',animation:'fadeUp 0.2s ease' },

  // Typography
  pageTitle: { fontWeight:800,fontSize:22,letterSpacing:'-0.4px',marginBottom:4 },
  pageSub: { fontSize:13,color:'var(--text2)',marginBottom:20,lineHeight:1.6 },
  label: {
    fontSize:9,fontWeight:700,letterSpacing:'0.16em',
    textTransform:'uppercase',color:'var(--text3)',marginBottom:7,display:'block',
  },

  // Inputs
  input: {
    width:'100%',background:'var(--surface2)',
    border:'1.5px solid var(--border)',borderRadius:'var(--r)',
    padding:'12px 14px',
    fontFamily:'Syne',fontSize:15,color:'var(--text)',outline:'none',
    marginBottom:14,transition:'border-color 0.15s',
  },

  // Chips
  chips: { display:'flex',flexWrap:'wrap',gap:7,marginBottom:16 },
  chip: (active) => ({
    padding:'6px 13px',borderRadius:'var(--r3)',
    border: active ? '1.5px solid var(--red)' : '1.5px solid var(--border2)',
    background: active ? 'rgba(224,48,48,0.12)' : 'transparent',
    color: active ? 'var(--red2)' : 'var(--text2)',
    fontFamily:'Syne',fontSize:12,fontWeight:600,
    cursor:'pointer',transition:'all 0.15s',
  }),

  // Buttons
  btn: (variant='red', sm=false) => ({
    width: sm ? 'auto' : '100%',
    padding: sm ? '6px 14px' : '14px',
    borderRadius: sm ? 'var(--r3)' : 'var(--r2)',
    border:'none',cursor:'pointer',
    fontFamily:'Syne',fontSize: sm ? 11 : 14,fontWeight:700,
    display:'flex',alignItems:'center',justifyContent:'center',gap:7,
    transition:'opacity 0.15s,transform 0.1s',
    ...(variant==='red'    && { background:'var(--red)',color:'#fff' }),
    ...(variant==='green'  && { background:'var(--green)',color:'#fff' }),
    ...(variant==='wa'     && { background:'#25d366',color:'#fff' }),
    ...(variant==='outline'&& { background:'transparent',border:'1.5px solid var(--border2)',color:'var(--text2)' }),
    ...(variant==='ghost'  && { background:'var(--surface2)',color:'var(--text2)',border:'1px solid var(--border)' }),
  }),

  // Cards / blocks
  card: {
    background:'var(--surface)',border:'1px solid var(--border)',
    borderRadius:'var(--r2)',marginBottom:12,overflow:'hidden',
  },
  cardHead: {
    display:'flex',alignItems:'center',justifyContent:'space-between',
    padding:'10px 14px',borderBottom:'1px solid var(--border)',
    background:'rgba(255,255,255,0.02)',
  },
  cardBody: { padding:14,fontSize:14,lineHeight:1.8,color:'var(--text2)' },

  // Agent row
  agentRow: (state) => ({
    display:'flex',alignItems:'center',gap:10,
    padding:'9px 0',borderBottom:'1px solid var(--border)',
    opacity: state==='wait' ? 0.3 : 1,
    transition:'opacity 0.3s',
  }),
  agentNum: (state) => ({
    width:26,height:26,borderRadius:6,flexShrink:0,
    display:'flex',alignItems:'center',justifyContent:'center',
    fontSize:11,fontWeight:700,fontFamily:'JetBrains Mono',
    background: state==='run' ? 'var(--red)' : state==='done' ? 'var(--green)' : 'var(--surface3)',
    color: state==='wait' ? 'var(--text3)' : '#fff',
    transition:'all 0.3s',
  }),

  // Progress bar
  progBg: { height:3,background:'var(--surface3)',borderRadius:2,marginBottom:16,overflow:'hidden' },
  progFill: (pct) => ({
    height:'100%',background:'linear-gradient(90deg,var(--red),#ff6b35)',
    borderRadius:2,width:`${pct}%`,transition:'width 0.4s ease',
  }),

  // Headline block
  hlBlock: {
    borderTop:'3px solid var(--red)',
    paddingTop:16,paddingBottom:16,marginBottom:16,
    borderBottom:'1px solid var(--border)',
  },
  hlLabel: {
    fontSize:8,fontWeight:700,letterSpacing:'0.2em',
    textTransform:'uppercase',color:'var(--text3)',marginBottom:8,
  },
  hlSi: {
    fontFamily:'Noto Sans Sinhala,sans-serif',
    fontSize:20,fontWeight:700,lineHeight:1.35,color:'var(--text)',
  },
  hlEn: {
    fontSize:12,fontStyle:'italic',color:'var(--text3)',
    marginTop:6,fontFamily:'Syne',lineHeight:1.4,
  },
  hlMeta: { display:'flex',alignItems:'center',gap:8,marginTop:10 },
  pill: (type) => ({
    padding:'3px 10px',borderRadius:'var(--r3)',
    fontSize:10,fontWeight:700,
    border: `1px solid ${type==='high'?'var(--green)':type==='mid'?'var(--gold)':'var(--text3)'}`,
    color: type==='high'?'var(--green)':type==='mid'?'var(--gold)':'var(--text3)',
  }),

  // Score
  scoreRow: { display:'flex',alignItems:'center',gap:14,padding:'12px 14px' },
  scoreBig: { fontSize:44,fontWeight:800,lineHeight:1,color:'var(--green)',fontFamily:'Syne' },
  scoreInfo: { flex:1 },
  scoreLbl: { fontSize:9,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6 },
  sbarBg: { height:4,background:'var(--surface3)',borderRadius:2,overflow:'hidden' },
  sbarFill: (pct) => ({
    height:'100%',width:`${pct}%`,
    background:'linear-gradient(90deg,var(--green),#4ade80)',
    borderRadius:2,transition:'width 1s ease',
  }),

  // Platform cards
  platCard: (type) => ({
    borderRadius:'var(--r2)',overflow:'hidden',marginBottom:12,
    border: type==='fb' ? '1px solid rgba(96,165,250,0.2)' : '1px solid rgba(74,222,128,0.2)',
  }),
  platHead: (type) => ({
    display:'flex',alignItems:'center',justifyContent:'space-between',
    padding:'10px 14px',
    background: type==='fb' ? 'rgba(96,165,250,0.06)' : 'rgba(74,222,128,0.06)',
  }),
  platName: { fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:6 },
  platBody: {
    padding:14,
    fontFamily:'Noto Sans Sinhala,sans-serif',
    fontSize:14,lineHeight:1.8,color:'var(--text2)',whiteSpace:'pre-wrap',
  },

  // Tags
  tagsWrap: { display:'flex',flexWrap:'wrap',gap:6,padding:'12px 14px' },
  tag: {
    padding:'4px 10px',borderRadius:'var(--r3)',
    border:'1px solid var(--border2)',fontSize:11,color:'var(--text2)',
  },

  // Push notif
  pushCard: {
    display:'flex',alignItems:'flex-start',gap:10,
    padding:12,background:'var(--surface)',
    border:'1px solid var(--border)',borderRadius:'var(--r2)',marginBottom:12,
  },
  pushIcon: {
    width:36,height:36,borderRadius:8,
    background:'linear-gradient(135deg,var(--red),#ff6b35)',
    display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,
  },

  // Bottom approve bar
  approveBar: {
    position:'fixed',bottom:0,left:0,right:0,zIndex:50,
    background:'rgba(8,8,8,0.97)',
    backdropFilter:'blur(20px)',
    borderTop:'1px solid var(--border)',
    padding:'12px 16px calc(12px + env(safe-area-inset-bottom))',
  },
  approveInner: { display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,maxWidth:480,margin:'0 auto' },

  // Sheet overlay
  overlay: {
    position:'fixed',inset:0,zIndex:100,
    background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',
    display:'flex',alignItems:'flex-end',
  },
  sheet: {
    width:'100%',maxWidth:520,margin:'0 auto',
    background:'var(--surface)',
    borderRadius:'20px 20px 0 0',
    border:'1px solid var(--border)',borderBottom:'none',
    padding:'20px 16px calc(20px + env(safe-area-inset-bottom))',
    animation:'slideUp 0.25s ease',
  },
  sheetHandle: {
    width:36,height:4,borderRadius:2,
    background:'var(--surface3)',margin:'0 auto 18px',
  },

  // Success
  successOv: {
    position:'fixed',inset:0,zIndex:200,
    background:'var(--bg)',
    display:'flex',flexDirection:'column',
    alignItems:'center',justifyContent:'center',
    padding:'40px 24px',textAlign:'center',
  },
  successMark: {
    width:80,height:80,borderRadius:'50%',
    border:'2px solid var(--green)',
    display:'flex',alignItems:'center',justifyContent:'center',
    fontSize:34,marginBottom:20,
    animation:'pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
  },

  // History
  histItem: {
    display:'flex',alignItems:'center',gap:12,
    padding:'12px 0',borderBottom:'1px solid var(--border)',
  },
  histDot: (status) => ({
    width:8,height:8,borderRadius:'50%',flexShrink:0,
    background: status==='approved'?'var(--green)':status==='rejected'?'var(--red)':'var(--gold)',
  }),

  // Scheduler
  schedCard: {
    background:'var(--surface)',border:'1px solid var(--border)',
    borderRadius:'var(--r2)',padding:16,marginBottom:12,
  },
  toggleRow: {
    display:'flex',alignItems:'center',justifyContent:'space-between',
    padding:'10px 0',borderBottom:'1px solid var(--border)',marginBottom:14,
  },
  errorBox: {
    background:'rgba(224,48,48,0.08)',border:'1px solid rgba(224,48,48,0.25)',
    borderRadius:'var(--r)',padding:12,fontSize:13,color:'#ff8080',marginBottom:12,
  },

  divider: {
    textAlign:'center',color:'var(--text3)',
    fontSize:14,letterSpacing:6,margin:'16px 0',
  },
}

// ── Agents config ──────────────────────────────────────────────────────────
const AGENTS = [
  {id:1,name:'News Hunter',      icon:'🌍'},
  {id:2,name:'Fact Checker',     icon:'✅'},
  {id:3,name:'Trend Scorer',     icon:'📊'},
  {id:4,name:'Eng Architect',    icon:'✍️'},
  {id:5,name:'Sinhala Specialist',icon:'🗣️'},
  {id:6,name:'Creative Writer',  icon:'🎨'},
  {id:7,name:'SEO + Headlines',  icon:'🔍'},
  {id:8,name:'Image Conceptor',  icon:'🖼️'},
  {id:9,name:'Policy Guard',     icon:'⚖️'},
  {id:10,name:'Social Handler',  icon:'📱'},
  {id:11,name:'Grammar Pro',     icon:'📝'},
  {id:12,name:'Dispatcher',      icon:'🚀'},
]

const TOPICS = [
  {label:'🤖 AI',    val:'AI Technology'},
  {label:'🚀 Space', val:'Space Science'},
  {label:'🇱🇰 SL',   val:'Sri Lanka Tech'},
  {label:'₿ Crypto', val:'Crypto Bitcoin'},
  {label:'⚡ EV',    val:'Electric Vehicles'},
  {label:'🏥 Health',val:'Health Science'},
  {label:'🌍 Climate',val:'Climate Change'},
  {label:'🔥 Viral', val:'Trending Viral'},
]

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState('generate')
  const [topic, setTopic]       = useState('')
  const [output, setOutput]     = useState(null)
  const [agents, setAgents]     = useState({})
  const [progress, setProgress] = useState(0)
  const [running, setRunning]   = useState(false)
  const [error, setError]       = useState('')
  const [waOpen, setWaOpen]     = useState(false)
  const [waNum, setWaNum]       = useState('')
  const [success, setSuccess]   = useState('')
  const [history, setHistory]   = useState([])
  const [histLoad, setHistLoad] = useState(false)
  const [schedOn, setSchedOn]   = useState(false)
  const [schedH, setSchedH]     = useState(6)
  const [schedTopic, setSchedTopic] = useState('trending technology news')
  const [schedMsg, setSchedMsg] = useState('')
  const schedRef = useRef(null)

  // Tab change
  function goTab(t) {
    setTab(t)
    if (t === 'history') loadHistory()
  }

  // Generate
  async function generate() {
    if (running) return
    setRunning(true)
    setError('')
    setAgents({})
    setProgress(0)
    setOutput(null)

    const t = topic.trim() || 'trending technology news'

    try {
      const result = await runPipeline(t, 'trending', (id, state, msg) => {
        setAgents(prev => ({...prev, [id]: {state, msg}}))
        setProgress(Math.round(id/12*100))
      })

      // Save to Supabase
      const {data, error: dbErr} = await supabase
        .from('news_posts')
        .insert([result])
        .select()
      if (!dbErr && data?.[0]) result.id = data[0].id

      setOutput(result)
      goTab('article')
      // Auto scroll to image after short delay
      setTimeout(() => {
        document.getElementById('auto-image-section')?.scrollIntoView({behavior:'smooth'})
      }, 800)
    } catch(e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  // Approve
  async function approve() {
    if (!output?.id) return
    await supabase.from('news_posts').update({status:'approved'}).eq('id', output.id)
    setSuccess('Article approved and saved! ✓')
  }

  // Reject
  async function reject() {
    if (!confirm('Reject this article?')) return
    if (output?.id) await supabase.from('news_posts').update({status:'rejected'}).eq('id', output.id)
    setOutput(null)
    goTab('generate')
  }

  // ── Ad Template ──────────────────────────────────────────────────────────
  const AD = `

━━━━━━━━━━━━━━━━━━━━
🏢 SmartBiz Business Management
ඔයාගේ business smart කරන්න!
✅ Inventory Management
✅ Invoicing & Billing
✅ Multi-branch Support
✅ Real-time Reports
🆓 FREE Demo එකක් ගන්න!
📞 0706 061 964
━━━━━━━━━━━━━━━━━━━━`

  // WhatsApp — +94 auto prefix
  function sendWa() {
    let num = waNum.trim().replace(/\s/g,'')
    // Auto add +94 if Sri Lankan number without country code
    if (num.startsWith('0') && num.length === 10) {
      num = '94' + num.slice(1)
    } else if (num.startsWith('+')) {
      num = num.replace('+','')
    }
    const msg = (output?.whatsapp || output?.headline_si || '') + AD
    const enc = encodeURIComponent(msg)
    window.open(num ? `https://wa.me/${num}?text=${enc}` : `https://wa.me/?text=${enc}`, '_blank')
    if (output?.id) supabase.from('news_posts').update({status:'approved'}).eq('id', output.id)
    setWaOpen(false)
    setSuccess(`"${(output?.headline_si||'').slice(0,35)}..." sent to WhatsApp! ✓`)
  }

  // WhatsApp Profile (direct to owner)
  function sendToProfile() {
    const msg = (output?.whatsapp || output?.headline_si || '') + AD
    const enc = encodeURIComponent(msg)
    window.open(`https://wa.me/94706061964?text=${enc}`, '_blank')
    if (output?.id) supabase.from('news_posts').update({status:'approved'}).eq('id', output.id)
    setSuccess(`"${(output?.headline_si||'').slice(0,35)}..." sent! ✓`)
  }

  // Copy
  function copy(text, btn) {
    navigator.clipboard?.writeText(text)
    if (btn) { btn.textContent = 'Copied!'; setTimeout(()=> btn.textContent='Copy', 1500) }
  }

  // History
  async function loadHistory(status) {
    setHistLoad(true)
    let q = supabase.from('news_posts').select('id,headline_si,headline_en,virality,status,created_at').order('created_at',{ascending:false}).limit(25)
    if (status) q = q.eq('status', status)
    const {data} = await q
    setHistory(data || [])
    setHistLoad(false)
  }

  // Scheduler
  function toggleSched() {
    const next = !schedOn
    setSchedOn(next)
    if (next) {
      schedRef.current = setInterval(async () => {
        try {
          const res = await runPipeline(schedTopic, 'trending', () => {})
          await supabase.from('news_posts').insert([res])
          console.log('Auto article saved:', res.headline_si?.slice(0,40))
        } catch(e) { console.error('Auto error:', e) }
      }, schedH * 3600 * 1000)
      setSchedMsg(`✓ Auto ON — every ${schedH}h, topic: "${schedTopic}"`)
    } else {
      clearInterval(schedRef.current)
      setSchedMsg('Scheduler stopped.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const agSt = (id) => agents[id]?.state || 'wait'
  const agMsg = (id) => agents[id]?.msg   || 'Waiting...'

  return (
    <div style={S.app}>

      {/* TOP BAR */}
      <div style={S.topbar}>
        <div style={S.brandRow}>
          <div style={S.brandMark}>SB</div>
          <div>
            <div style={S.brandName}>SmartBiz</div>
            <div style={S.brandSub}>News Desk · AI</div>
          </div>
        </div>
        <div style={S.liveBadge}>
          <div style={S.liveDot}></div>
          {running ? 'Processing' : 'Live'}
        </div>
      </div>

      {/* NAV TABS */}
      <div style={S.tabs}>
        {[
          {id:'generate',icon:'⚡',label:'Generate'},
          {id:'article', icon:'📰',label:'Article'},
          {id:'social',  icon:'📱',label:'Social'},
          {id:'scheduler',icon:'🤖',label:'Auto'},
          {id:'history', icon:'📋',label:'History'},
        ].map(t => (
          <button key={t.id} style={S.tab(tab===t.id)} onClick={()=>goTab(t.id)}>
            <span style={S.tabIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div style={S.main}>

        {/* ── GENERATE ── */}
        {tab==='generate' && (
          <div style={S.screen}>
            <div style={S.pageTitle}>News Desk</div>
            <div style={S.pageSub}>Pick a topic — 12 AI agents write your article</div>

            <span style={S.label}>Topic</span>
            <input
              style={S.input}
              value={topic}
              onChange={e=>setTopic(e.target.value)}
              placeholder="Type your topic..."
              onFocus={e=>e.target.style.borderColor='var(--red)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />

            <span style={S.label}>Quick Topics</span>
            <div style={S.chips}>
              {TOPICS.map(t=>(
                <button key={t.val} style={S.chip(topic===t.val)} onClick={()=>setTopic(t.val)}>
                  {t.label}
                </button>
              ))}
            </div>

            {error && <div style={S.errorBox}>⚠️ {error}</div>}

            {/* Agent Progress */}
            {running && (
              <div style={{background:'var(--surface)',borderRadius:'var(--r2)',padding:14,marginBottom:14}}>
                <div style={S.progBg}><div style={S.progFill(progress)}></div></div>
                {AGENTS.map(a => (
                  <div key={a.id} style={S.agentRow(agSt(a.id))}>
                    <div style={S.agentNum(agSt(a.id))}>{a.id}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600}}>{a.name}</div>
                      <div style={{fontSize:10,color: agSt(a.id)==='run'?'var(--red)':agSt(a.id)==='done'?'var(--green)':'var(--text3)',marginTop:1}}>
                        {agMsg(a.id)}
                      </div>
                    </div>
                    {agSt(a.id)==='run' && (
                      <div style={{width:12,height:12,border:'2px solid rgba(224,48,48,0.2)',borderTopColor:'var(--red)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}></div>
                    )}
                    {agSt(a.id)==='done' && <span style={{fontSize:12}}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            <div style={S.divider}>· · ·</div>
            <button style={{...S.btn('red'),opacity:running?0.5:1}} onClick={generate} disabled={running}>
              {running
                ? <><div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}></div> Generating...</>
                : '⚡ Generate Article'
              }
            </button>
          </div>
        )}

        {/* ── ARTICLE ── */}
        {tab==='article' && (
          <div style={S.screen}>
            {!output ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'40px 0',fontSize:14}}>
                No article yet — Generate one first ⚡
              </div>
            ) : (
              <>
                <div style={S.hlBlock}>
                  <div style={S.hlLabel}>SmartBiz · Sinhala Edition</div>
                  <div style={{...S.hlSi, fontFamily:'Noto Sans Sinhala,sans-serif'}}>{output.headline_si}</div>
                  <div style={S.hlEn}>{output.headline_en}</div>
                  <div style={S.hlMeta}>
                    <span style={{fontSize:10,color:'var(--text3)'}}>Virality: {output.virality}/10</span>
                    <span style={S.pill(output.virality>=8?'high':output.virality>=6?'mid':'low')}>
                      {output.virality>=8?'🔥 Hot':output.virality>=6?'📈 Trending':'📊 Moderate'}
                    </span>
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.cardHead}>
                    <span style={S.label}>Sinhala Article</span>
                    <button style={S.btn('outline',true)} onClick={e=>copy(output.article_si,e.target)}>Copy</button>
                  </div>
                  <div style={{...S.cardBody,fontFamily:'Noto Sans Sinhala,sans-serif',fontSize:15}}>{output.article_si}</div>
                </div>

                <div style={S.card}>
                  <div style={S.cardHead}>
                    <span style={S.label}>English Article</span>
                    <button style={S.btn('outline',true)} onClick={e=>copy(output.article_en,e.target)}>Copy</button>
                  </div>
                  <div style={S.cardBody}>{output.article_en}</div>
                </div>

                <div id="auto-image-section">
                  <ImageGenerator prompt={output.image_prompt} headline={output.headline_en || output.headline_si} autoGenerate={true} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SOCIAL ── */}
        {tab==='social' && (
          <div style={S.screen}>
            {!output ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'40px 0',fontSize:14}}>No article yet</div>
            ) : (
              <>
                <div style={S.card}>
                  <div style={S.scoreRow}>
                    <div style={S.scoreBig}>{output.virality}</div>
                    <div style={S.scoreInfo}>
                      <div style={S.scoreLbl}>Virality Score / 10</div>
                      <div style={S.sbarBg}><div style={S.sbarFill(output.virality*10)}></div></div>
                    </div>
                  </div>
                </div>

                {/* Facebook */}
                <div style={S.platCard('fb')}>
                  <div style={S.platHead('fb')}>
                    <div style={S.platName}><span>📘</span> Facebook</div>
                    <button style={S.btn('outline',true)} onClick={e=>copy((output.facebook||'')+AD,e.target)}>Copy</button>
                  </div>
                  <div style={S.platBody}>{output.facebook}{AD}</div>
                </div>

                {/* WhatsApp */}
                <div style={S.platCard('wa')}>
                  <div style={S.platHead('wa')}>
                    <div style={S.platName}><span>💬</span> WhatsApp</div>
                    <button style={S.btn('outline',true)} onClick={e=>copy((output.whatsapp||'')+AD,e.target)}>Copy</button>
                  </div>
                  <div style={S.platBody}>{output.whatsapp}{AD}</div>
                </div>

                {/* Push */}
                <div style={S.pushCard}>
                  <div style={S.pushIcon}>📰</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:9,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>Push Notification</div>
                    <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.5,fontFamily:'Noto Sans Sinhala,sans-serif'}}>{output.push}</div>
                  </div>
                  <button style={S.btn('outline',true)} onClick={e=>copy(output.push,e.target)}>Copy</button>
                </div>

                {/* Tags */}
                <div style={S.card}>
                  <div style={S.cardHead}><span style={S.label}>Tags</span></div>
                  <div style={S.tagsWrap}>
                    {(output.tags||[]).map((t,i)=><span key={i} style={S.tag}>#{t}</span>)}
                  </div>
                  <div style={{...S.cardBody,borderTop:'1px solid var(--border)',paddingTop:10,fontStyle:'italic',fontSize:13,color:'var(--text3)'}}>
                    {output.meta_desc}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SCHEDULER ── */}
        {tab==='scheduler' && (
          <div style={S.screen}>
            <div style={S.pageTitle}>Auto Generate</div>
            <div style={S.pageSub}>Enable and walk away — articles auto-generate and save to Supabase</div>

            <div style={S.schedCard}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🤖 Auto Article Generator</div>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:14,lineHeight:1.6}}>
                Runs in the browser — keep this tab open for auto generation.
              </div>

              <div style={S.toggleRow}>
                <span style={{fontSize:14,fontWeight:600}}>Auto Generate</span>
                <button
                  onClick={toggleSched}
                  style={{
                    width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',
                    background: schedOn ? 'var(--green)' : 'var(--surface3)',
                    position:'relative',transition:'background 0.2s',flexShrink:0,
                  }}
                >
                  <div style={{
                    position:'absolute',width:18,height:18,background:'#fff',
                    borderRadius:'50%',top:3,
                    left: schedOn ? 23 : 3,
                    transition:'left 0.2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
                  }}></div>
                </button>
              </div>

              <span style={{...S.label,marginTop:14}}>Topic</span>
              <input
                style={S.input}
                value={schedTopic}
                onChange={e=>setSchedTopic(e.target.value)}
                placeholder="Auto generate topic..."
              />

              <span style={S.label}>Interval</span>
              <div style={S.chips}>
                {[2,4,6,12,24].map(h=>(
                  <button key={h} style={S.chip(schedH===h)} onClick={()=>setSchedH(h)}>{h}h</button>
                ))}
              </div>

              {schedMsg && (
                <div style={{
                  background: schedOn ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${schedOn?'rgba(34,197,94,0.2)':'var(--border)'}`,
                  borderRadius:'var(--r)',padding:10,fontSize:12,
                  color: schedOn ? 'var(--green)' : 'var(--text3)',marginTop:10,
                }}>
                  {schedMsg}
                </div>
              )}
            </div>

            <div style={S.schedCard}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>📊 Status</div>
              <div style={{fontSize:13,color:'var(--text2)',lineHeight:2.2}}>
                <div>Auto Generate: <b style={{color:schedOn?'var(--green)':'var(--text3)'}}>{schedOn?'🟢 ON':'🔴 OFF'}</b></div>
                <div>Interval: <b>{schedH} hours</b></div>
                <div>Topic: <b>{schedTopic}</b></div>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab==='history' && (
          <div style={S.screen}>
            <div style={S.pageTitle}>Article History</div>
            <div style={S.pageSub}>All articles saved in Supabase</div>

            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <button style={S.btn('ghost',true)} onClick={()=>loadHistory()}>↻ All</button>
              <button style={S.btn('ghost',true)} onClick={()=>loadHistory('pending')}>Pending</button>
              <button style={S.btn('ghost',true)} onClick={()=>loadHistory('approved')}>Approved</button>
              <button style={S.btn('ghost',true)} onClick={()=>loadHistory('rejected')}>Rejected</button>
            </div>

            {histLoad ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'30px 0'}}>Loading...</div>
            ) : history.length === 0 ? (
              <div style={{textAlign:'center',color:'var(--text3)',padding:'30px 0',fontSize:13}}>No articles found</div>
            ) : (
              history.map(a=>(
                <div key={a.id} style={S.histItem}>
                  <div style={S.histDot(a.status)}></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'Noto Sans Sinhala,sans-serif',fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {a.headline_si||a.headline_en||'No title'}
                    </div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
                      {a.status} · {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--green)',flexShrink:0}}>{a.virality}/10</div>
                </div>
              ))
            )}
          </div>
        )}

      </div>{/* /main */}

      {/* ── APPROVE BAR ── */}
      {output && (tab==='article'||tab==='social') && (
        <div style={S.approveBar}>
          <div style={S.approveInner}>
            <button style={{...S.btn('outline'),padding:11,fontSize:12}} onClick={reject}>✕ Reject</button>
            <button style={{...S.btn('wa'),    padding:11,fontSize:12}} onClick={()=>setWaOpen(true)}>💬 WhatsApp</button>
            <button style={{...S.btn('green'), padding:11,fontSize:12}} onClick={approve}>✓ Approve</button>
          </div>
        </div>
      )}

      {/* ── WA SHEET ── */}
      {waOpen && (
        <div style={S.overlay} onClick={e=>{if(e.target===e.currentTarget)setWaOpen(false)}}>
          <div style={S.sheet}>
            <div style={S.sheetHandle}></div>
            <div style={{fontWeight:800,fontSize:20,marginBottom:5}}>Send to WhatsApp</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:12,lineHeight:1.5}}>
              Number දෙන්න (07X හෝ +94X) — Ad auto attach වෙනවා.
            </div>

            {/* Quick send to own profile */}
            <button style={{...S.btn('wa'),marginBottom:10}} onClick={sendToProfile}>
              💬 My WhatsApp (0706 061 964)
            </button>

            <div style={{fontSize:11,color:'var(--text3)',textAlign:'center',margin:'8px 0'}}>— හෝ වෙනත් number —</div>

            <input
              type="tel"
              style={{...S.input,marginBottom:10}}
              value={waNum}
              onChange={e=>setWaNum(e.target.value)}
              placeholder="077 123 4567 (SL auto +94)"
            />
            <button style={S.btn('wa')} onClick={sendWa}>💬 Send WhatsApp</button>
            <button style={{...S.btn('ghost'),marginTop:8}} onClick={()=>setWaOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {success && (
        <div style={S.successOv}>
          <div style={S.successMark}>✓</div>
          <div style={{fontWeight:800,fontSize:24,marginBottom:8}}>Done!</div>
          <div style={{fontSize:14,color:'var(--text3)',lineHeight:1.6,marginBottom:24}}>{success}</div>
          <button style={{...S.btn('outline'),width:'auto',padding:'12px 32px'}} onClick={()=>{setSuccess('');setOutput(null);goTab('generate')}}>
            + New Article
          </button>
        </div>
      )}

    </div>
  )
}
