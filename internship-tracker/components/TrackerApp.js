'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import RecordModal from './RecordModal'

const EXAM_RESULT_COLOR = {
  '通过':    { bg: '#4CAF50', border: '#4CAF50' },
  '不通过':  { bg: '#E57373', border: '#E57373' },
  '迟交':    { bg: '#FF9800', border: '#FF9800' },
  '放弃':    { bg: '#9E9E9E', border: '#9E9E9E' },
  '待定':    { bg: '#3B6FA0', border: '#3B6FA0' },
}
const IV_RESULT_COLOR = {
  '通过':   { bg: '#4CAF50', border: '#4CAF50' },
  '不通过': { bg: '#E57373', border: '#E57373' },
  '待定':   { bg: '#3B6FA0', border: '#3B6FA0' },
}
const EMPTY_DOT = { bg: '#e0e0e0', border: '#e0e0e0' }

function TimelineDots({ rec }) {
  const fmt = d => {
    if (!d) return null
    const [y,m,dy] = d.split('-')
    return `${y}/${m}/${dy}`
  }

  const stages = [
    {
      key: 'exam',
      label: '笔',
      hasData: rec.has_exam === '有',
      date: fmt(rec.exam_date),
      status: rec.exam_status,
      colors: EXAM_RESULT_COLOR,
    },
    { key: 'iv1', label: '一', hasData: !!rec.interview1_date, date: fmt(rec.interview1_date), status: rec.interview1_status, colors: IV_RESULT_COLOR },
    { key: 'iv2', label: '二', hasData: !!rec.interview2_date, date: fmt(rec.interview2_date), status: rec.interview2_status, colors: IV_RESULT_COLOR },
    { key: 'iv3', label: '三', hasData: !!rec.interview3_date, date: fmt(rec.interview3_date), status: rec.interview3_status, colors: IV_RESULT_COLOR },
  ]

  return (
    <div style={{ display:'flex', alignItems:'center', gap:0 }}>
      {stages.map((stage, i) => {
        const active = stage.hasData
        const color = active ? (stage.colors[stage.status] || stage.colors['待定']) : EMPTY_DOT
        return (
          <React.Fragment key={stage.key}>
            {i > 0 && (
              <div style={{ width:14, height:2, background: active ? 'rgba(59,111,160,0.2)' : '#eee', flexShrink:0 }}/>
            )}
            <div style={{ position:'relative' }} className="dot-wrap">
              <div
                title={active ? `${stage.label}面${stage.date ? `｜${stage.date}` : ''}${stage.status ? `｜${stage.status}` : ''}` : ''}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: active ? color.bg : '#f0f0f0',
                  border: `2px solid ${active ? color.border : '#ddd'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: active ? '#fff' : '#bbb',
                  cursor: active ? 'default' : 'default',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {stage.label}
                {active && stage.date && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 6,
                    background: 'rgba(30,40,60,0.92)',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                    zIndex: 10,
                  }} className="dot-tooltip">
                    {stage.date}{stage.status ? ` · ${stage.status}` : ''}
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        )
      })}
      <style>{`
        .dot-wrap:hover .dot-tooltip { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

function getOverallStatus(rec) {
  const today = new Date(); today.setHours(0,0,0,0)
  const toDate = s => {
    if (!s) return null
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const submitDate = toDate(rec.submit_date)
  const i1 = toDate(rec.interview1_date)
  const i2 = toDate(rec.interview2_date)
  const i3 = toDate(rec.interview3_date)
  const statuses = [rec.interview1_status, rec.interview2_status, rec.interview3_status]

  if (statuses.some(s => s === '不通过')) return { label: '已拒绝', color: '#E57373', dot: '#E57373' }
  if (statuses.some(s => s === '通过') && !statuses.some(s => s === '不通过') && !i1 && !i2 && !i3)
    return { label: '已录用', color: '#4CAF50', dot: '#4CAF50' }
  if ([i1,i2,i3].some(d => d && d >= today)) return { label: '面试中', color: '#3B6FA0', dot: '#3B6FA0' }
  if ([{d:i1,s:rec.interview1_status},{d:i2,s:rec.interview2_status},{d:i3,s:rec.interview3_status}]
      .some(({d,s}) => d && d < today && s === '待定')) return { label: '等待结果', color: '#FFB74D', dot: '#FFB74D' }
  if (rec.has_exam === '有' && rec.exam_status === '待定') return { label: '笔试中', color: '#7B6B8D', dot: '#7B6B8D' }
  if (!submitDate || submitDate > today) return { label: '待投递', color: '#BDBDBD', dot: '#BDBDBD' }
  return { label: '简历筛选中', color: '#FFB74D', dot: '#FFB74D' }
}

const fmt = d => {
  if (!d) return null
  const [y,m,dy] = d.split('-')
  return `${y}/${m}/${dy}`
}

export default function TrackerApp({ user }) {
  const supabase = createClient()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCompany, setFilterCompany] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [customPositions, setCustomPositions] = useState([])

  const fetchRecords = async () => {
    const { data } = await supabase
      .from('internship_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const handleSave = async (form) => {
    const dateFields = ['submit_date','exam_date','interview1_date','interview2_date','interview3_date']
    const cleaned = { ...form }
    dateFields.forEach(f => { if (!cleaned[f]) cleaned[f] = null })
    if (editing === 'new') {
      await supabase.from('internship_records').insert({ ...cleaned, user_id: user.id })
    } else {
      await supabase.from('internship_records').update(cleaned).eq('id', editing.id)
    }
    await fetchRecords()
    setEditing(null)
  }

  const handleDelete = async (id) => {
    await supabase.from('internship_records').delete().eq('id', id)
    await fetchRecords()
    setDeleteId(null)
  }

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const filtered = records
    .filter(r => {
      if (filterCompany && !r.company.toLowerCase().includes(filterCompany.toLowerCase())) return false
      if (filterStatus !== 'all' && getOverallStatus(r).label !== filterStatus) return false
      return true
    })
    .sort((a, b) => {
      const da = a.submit_date || '', db = b.submit_date || ''
      return sortAsc ? da.localeCompare(db) : db.localeCompare(da)
    })

  const stats = {
    total: records.length,
    active: records.filter(r => ['面试中','等待结果','笔试中','简历筛选中'].includes(getOverallStatus(r).label)).length,
    offer: records.filter(r => getOverallStatus(r).label === '已录用').length,
    rejected: records.filter(r => getOverallStatus(r).label === '已拒绝').length,
  }

  const statusOptions = ['all','待投递','简历筛选中','笔试中','面试中','等待结果','已录用','已拒绝']

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div style={{ width:36,height:36,border:'3px solid #ddd',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>
    </div>
  )

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📋 实习投递追踪</h1>
          <p style={s.sub}>{user.user_metadata?.full_name || user.email} · 管理你的实习申请进度</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button style={s.addBtn} onClick={() => setEditing('new')}>＋ 添加记录</button>
          <button style={s.signOutBtn} onClick={handleSignOut}>退出</button>
        </div>
      </div>

      <div style={s.statsRow}>
        {[
          { label:'总计投递', value:stats.total, color:'#3B6FA0' },
          { label:'进行中', value:stats.active, color:'#FFB74D' },
          { label:'已录用', value:stats.offer, color:'#4CAF50' },
          { label:'已拒绝', value:stats.rejected, color:'#E57373' },
        ].map(st => (
          <div key={st.label} style={{ ...s.statCard, borderTop:`3px solid ${st.color}` }}>
            <div style={{ ...s.statValue, color:st.color }}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={s.filterRow}>
        <input style={s.searchInput} placeholder="🔍 搜索公司..." value={filterCompany} onChange={e => setFilterCompany(e.target.value)}/>
        <select style={s.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {statusOptions.map(o => <option key={o} value={o}>{o === 'all' ? '全部状态' : o}</option>)}
        </select>
        <button style={s.sortBtn} onClick={() => setSortAsc(!sortAsc)}>投递时间 {sortAsc ? '↑' : '↓'}</button>
      </div>

      {/* 图例 */}
      <div style={s.legend}>
        <span style={s.legendTitle}>时间轴图例：</span>
        {[
          { color:'#4CAF50', label:'通过' },
          { color:'#E57373', label:'不通过' },
          { color:'#3B6FA0', label:'待定' },
          { color:'#FF9800', label:'迟交' },
          { color:'#9E9E9E', label:'放弃' },
          { color:'#e0e0e0', label:'未填写', textColor:'#bbb' },
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:l.color, flexShrink:0 }}/>
            <span style={{ fontSize:11, color: l.textColor || '#666' }}>{l.label}</span>
          </div>
        ))}
        <span style={{ fontSize:11, color:'#aaa', marginLeft:4 }}>（悬停圆点可查看日期）</span>
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
          <p style={{ color:'var(--text-muted)', fontSize:15 }}>
            {records.length === 0 ? '还没有投递记录，点击"添加记录"开始吧！' : '没有匹配的记录'}
          </p>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['公司名称','地点','实习类型','岗位','项目组','投递时间','进度','当前状态','操作'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, idx) => {
                const status = getOverallStatus(rec)
                const isExpanded = expandedId === rec.id
                const rowBg = idx%2===0 ? 'transparent' : 'rgba(59,111,160,0.025)'
                return (
                  <React.Fragment key={rec.id}>
                    <tr style={{ background:rowBg, cursor:'pointer' }} onClick={() => setExpandedId(isExpanded ? null : rec.id)}>
                      <td style={s.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:8,height:8,borderRadius:'50%',background:status.dot,flexShrink:0 }}/>
                          <span style={{ fontWeight:700 }}>{rec.company}</span>
                          <span style={{ fontSize:10, color:'#bbb' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </td>
                      <td style={s.td}>{rec.location ? <span style={s.locBadge}>📍 {rec.location}</span> : <span style={s.dash}>—</span>}</td>
                      <td style={s.td}><span style={s.typeBadge}>{rec.intern_type}</span></td>
                      <td style={s.td}>
                        <span style={s.posBadge}>{rec.position_type === '其他岗位' ? (rec.custom_position||'其他') : rec.position_type}</span>
                      </td>
                      <td style={s.td}>{rec.team ? <span style={{ fontSize:12, color:'var(--text-muted)' }}>{rec.team}</span> : <span style={s.dash}>—</span>}</td>
                      <td style={s.td}>{fmt(rec.submit_date) || <span style={s.dash}>—</span>}</td>
                      <td style={{ ...s.td }} onClick={e => e.stopPropagation()}>
                        <TimelineDots rec={rec}/>
                      </td>
                      <td style={s.td}>
                        <span style={{ background:'rgba(59,111,160,0.08)', color:status.color, padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                          <button style={s.editBtn} onClick={() => setEditing(rec)}>编辑</button>
                          <button style={s.delBtn} onClick={() => setDeleteId(rec.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background:rowBg }}>
                        <td colSpan={9} style={{ padding:'0 16px 16px 32px' }}>
                          <div style={s.detailPanel}>
                            <div style={s.detailGrid}>
                              {rec.location && <div style={s.di}><span style={s.dl}>公司地点</span><span style={s.dv}>📍 {rec.location}</span></div>}
                              {rec.team && <div style={s.di}><span style={s.dl}>项目组 / 部门</span><span style={s.dv}>{rec.team}</span></div>}
                              <div style={s.di}><span style={s.dl}>实习类型</span><span style={s.dv}>{rec.intern_type}</span></div>
                              <div style={s.di}><span style={s.dl}>岗位类型</span><span style={s.dv}>{rec.position_type === '其他岗位' ? (rec.custom_position||'其他') : rec.position_type}</span></div>
                              <div style={s.di}><span style={s.dl}>投递时间</span><span style={s.dv}>{fmt(rec.submit_date)||'未填写'}</span></div>
                              {rec.has_exam === '有' && <div style={s.di}><span style={s.dl}>笔试</span><span style={s.dv}>{fmt(rec.exam_date)||'—'} · {rec.exam_status||'待定'}</span></div>}
                              {rec.interview1_date && <div style={s.di}><span style={s.dl}>一面</span><span style={s.dv}>{fmt(rec.interview1_date)} · {rec.interview1_status||'待定'}</span></div>}
                              {rec.interview2_date && <div style={s.di}><span style={s.dl}>二面</span><span style={s.dv}>{fmt(rec.interview2_date)} · {rec.interview2_status||'待定'}</span></div>}
                              {rec.interview3_date && <div style={s.di}><span style={s.dl}>三面</span><span style={s.dv}>{fmt(rec.interview3_date)} · {rec.interview3_status||'待定'}</span></div>}
                              {rec.job_url && (
                                <div style={{ ...s.di, gridColumn:'1/-1' }}>
                                  <span style={s.dl}>岗位链接</span>
                                  <a href={rec.job_url} target="_blank" rel="noopener noreferrer" style={s.jobLink}>🔗 {rec.job_url}</a>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <div style={s.overlay} onClick={() => setDeleteId(null)}>
          <div style={s.confirmBox} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize:15, marginBottom:20, lineHeight:1.6 }}>确定要删除这条记录吗？此操作不可撤销。</p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button style={s.cancelBtn} onClick={() => setDeleteId(null)}>取消</button>
              <button style={s.delBtnLg} onClick={() => handleDelete(deleteId)}>确认删除</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <RecordModal
          record={editing === 'new' ? null : editing}
          customPositions={customPositions}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          onAddCustomPosition={pos => setCustomPositions(prev => [...prev, pos])}
        />
      )}
    </div>
  )
}

const s = {
  container: { maxWidth:1100, margin:'0 auto', padding:'24px 16px', minHeight:'100vh' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 },
  title: { fontSize:26, fontWeight:800, letterSpacing:'-0.5px', margin:0 },
  sub: { fontSize:13, color:'var(--text-muted)', marginTop:4 },
  addBtn: { background:'linear-gradient(135deg,#3B6FA0,#2d5a87)', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:600, boxShadow:'0 2px 8px rgba(59,111,160,0.3)', cursor:'pointer' },
  signOutBtn: { background:'transparent', border:'1.5px solid var(--border)', borderRadius:8, padding:'9px 16px', fontSize:13, color:'var(--text-muted)', fontWeight:500, cursor:'pointer' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:16 },
  statCard: { background:'#fff', borderRadius:10, padding:'16px 14px', textAlign:'center', boxShadow:'var(--shadow)' },
  statValue: { fontSize:28, fontWeight:800 },
  statLabel: { fontSize:12, color:'var(--text-muted)', marginTop:4, fontWeight:500 },
  legend: { display:'flex', alignItems:'center', gap:12, marginBottom:12, flexWrap:'wrap', background:'#fff', borderRadius:8, padding:'8px 14px', boxShadow:'var(--shadow)' },
  legendTitle: { fontSize:11, fontWeight:700, color:'var(--text-muted)', marginRight:4 },
  filterRow: { display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center' },
  searchInput: { flex:1, minWidth:160, padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', background:'#fff' },
  filterSelect: { padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, background:'#fff', outline:'none', cursor:'pointer' },
  sortBtn: { padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, background:'#fff', fontWeight:600, color:'var(--accent)', cursor:'pointer' },
  tableWrap: { overflowX:'auto', background:'#fff', borderRadius:12, boxShadow:'var(--shadow)' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', padding:'14px 12px', fontWeight:700, fontSize:11, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'2px solid var(--bg)', whiteSpace:'nowrap' },
  td: { padding:'12px', borderBottom:'1px solid #f3f4f6', verticalAlign:'middle' },
  dash: { color:'#ccc' },
  locBadge: { fontSize:11, color:'#7B6B8D', background:'rgba(123,107,141,0.08)', padding:'2px 8px', borderRadius:10, whiteSpace:'nowrap' },
  typeBadge: { background:'rgba(59,111,160,0.1)', color:'#3B6FA0', padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600, whiteSpace:'nowrap' },
  posBadge: { background:'rgba(123,107,141,0.1)', color:'#7B6B8D', padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600, whiteSpace:'nowrap' },
  detailPanel: { background:'rgba(59,111,160,0.04)', borderRadius:10, padding:'14px 16px', border:'1px solid rgba(59,111,160,0.1)', marginTop:4 },
  detailGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'10px 24px' },
  di: { display:'flex', flexDirection:'column', gap:3 },
  dl: { fontSize:10, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.4px' },
  dv: { fontSize:13, color:'var(--text)', fontWeight:500 },
  jobLink: { fontSize:13, color:'var(--accent)', textDecoration:'none', wordBreak:'break-all', fontWeight:500 },
  empty: { textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:12, boxShadow:'var(--shadow)' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 },
  confirmBox: { background:'#fff', borderRadius:14, padding:28, maxWidth:360, width:'100%', boxShadow:'var(--shadow-lg)' },
  cancelBtn: { background:'#f5f5f5', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, color:'#666', cursor:'pointer' },
  delBtnLg: { background:'#E57373', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' },
  editBtn: { background:'transparent', border:'1.5px solid var(--accent)', color:'var(--accent)', borderRadius:6, padding:'4px 12px', fontSize:12, fontWeight:600, cursor:'pointer' },
  delBtn: { background:'transparent', border:'1.5px solid #E57373', color:'#E57373', borderRadius:6, padding:'4px 12px', fontSize:12, fontWeight:600, cursor:'pointer' },
}
