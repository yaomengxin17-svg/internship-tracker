'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import RecordModal from './RecordModal'

const INTERNSHIP_TYPES = ['日常实习', '暑期实习', '训练营']
const DEFAULT_POSITIONS = ['游戏策划大类', '关卡策划', '系统策划', '任务策划', '叙事策划', '其他岗位']
const EXAM_STATUS_COLORS = {
  '放弃': { bg: 'rgba(158,158,158,0.15)', color: '#616161' },
  '迟交': { bg: 'rgba(255,152,0,0.12)', color: '#E65100' },
  '待定': { bg: 'rgba(189,189,189,0.12)', color: '#888' },
  '通过': { bg: 'rgba(76,175,80,0.12)', color: '#2E7D32' },
  '不通过': { bg: 'rgba(229,115,115,0.12)', color: '#C62828' },
}
const INTERVIEW_STATUS_COLORS = {
  '通过': { bg: 'rgba(76,175,80,0.12)', color: '#2E7D32' },
  '不通过': { bg: 'rgba(229,115,115,0.12)', color: '#C62828' },
  '待定': { bg: 'rgba(189,189,189,0.12)', color: '#888' },
}

function Badge({ status, colors }) {
  const c = colors[status] || colors['待定']
  return (
    <span style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
      {status || '待定'}
    </span>
  )
}

function getOverallStatus(rec) {
  const today = new Date(); today.setHours(0,0,0,0)
  const toDate = s => s ? new Date(s) : null

  const submitDate = toDate(rec.submit_date)
  const i1date = toDate(rec.interview1_date)
  const i2date = toDate(rec.interview2_date)
  const i3date = toDate(rec.interview3_date)

  if ([rec.interview1_status, rec.interview2_status, rec.interview3_status].some(s => s === '不通过'))
    return { label: '已拒绝', color: '#E57373', dot: '#E57373' }
  if ([rec.interview1_status, rec.interview2_status, rec.interview3_status].some(s => s === '通过') &&
      ![rec.interview1_status, rec.interview2_status, rec.interview3_status].some(s => s === '不通过') &&
      !i1date && !i2date && !i3date)
    return { label: '已录用', color: '#4CAF50', dot: '#4CAF50' }

  const hasUpcomingInterview = [i1date, i2date, i3date].some(d => d && d >= today)
  const hasPastPendingInterview = [
    { d: i1date, s: rec.interview1_status },
    { d: i2date, s: rec.interview2_status },
    { d: i3date, s: rec.interview3_status },
  ].some(({ d, s }) => d && d < today && s === '待定')

  if (hasUpcomingInterview) return { label: '面试中', color: '#3B6FA0', dot: '#3B6FA0' }
  if (hasPastPendingInterview) return { label: '等待结果', color: '#FFB74D', dot: '#FFB74D' }
  if (rec.has_exam === '有' && rec.exam_status === '待定') return { label: '笔试中', color: '#7B6B8D', dot: '#7B6B8D' }
  if (!submitDate || submitDate > today) return { label: '待投递', color: '#BDBDBD', dot: '#BDBDBD' }
  return { label: '简历筛选中', color: '#FFB74D', dot: '#FFB74D' }
}

const formatDate = d => {
  if (!d) return null
  const date = new Date(d)
  return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`
}

export default function TrackerApp({ user }) {
  const supabase = createClient()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | record
  const [deleteId, setDeleteId] = useState(null)
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
    const dateFields = ['submit_date', 'exam_date', 'interview1_date', 'interview2_date', 'interview3_date']
    const cleaned = { ...form }
    dateFields.forEach(f => { if (cleaned[f] === '') cleaned[f] = null })

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const filtered = records
    .filter(r => {
      if (filterCompany && !r.company.toLowerCase().includes(filterCompany.toLowerCase())) return false
      if (filterStatus !== 'all' && getOverallStatus(r).label !== filterStatus) return false
      return true
    })
    .sort((a, b) => {
      const da = a.submit_date || ''
      const db = b.submit_date || ''
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
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📋 实习投递追踪</h1>
          <p style={s.sub}>{user.user_metadata?.full_name || user.email} · 管理你的实习申请进度</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button style={s.addBtn} onClick={() => setEditing('new')}>＋ 添加记录</button>
          <button style={s.signOutBtn} onClick={handleSignOut} title="退出登录">退出</button>
        </div>
      </div>

      {/* Stats */}
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

      {/* Filters */}
      <div style={s.filterRow}>
        <input
          style={s.searchInput}
          placeholder="🔍 搜索公司..."
          value={filterCompany}
          onChange={e => setFilterCompany(e.target.value)}
        />
        <select style={s.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {statusOptions.map(o => <option key={o} value={o}>{o === 'all' ? '全部状态' : o}</option>)}
        </select>
        <button style={s.sortBtn} onClick={() => setSortAsc(!sortAsc)}>
          投递时间 {sortAsc ? '↑' : '↓'}
        </button>
      </div>

      {/* Table */}
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
                {['公司名称','实习类型','岗位','投递时间','笔试','一面','二面','三面','当前状态','操作'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, idx) => {
                const status = getOverallStatus(rec)
                return (
                  <tr key={rec.id} style={{ background: idx%2===0 ? 'transparent' : 'rgba(59,111,160,0.025)', animation:'fadeIn 0.3s ease' }}>
                    <td style={s.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:8,height:8,borderRadius:'50%',background:status.dot,flexShrink:0 }}/>
                        <span style={{ fontWeight:700 }}>{rec.company}</span>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.typeBadge}>{rec.intern_type}</span></td>
                    <td style={s.td}>
                      <span style={s.posBadge}>
                        {rec.position_type === '其他岗位' ? (rec.custom_position || '其他') : rec.position_type}
                      </span>
                    </td>
                    <td style={s.td}>{formatDate(rec.submit_date) || <span style={{ color:'#ccc' }}>—</span>}</td>
                    <td style={s.td}>
                      {rec.has_exam === '有' ? (
                        <div>
                          {rec.exam_date && <div style={s.dateSmall}>{formatDate(rec.exam_date)}</div>}
                          <Badge status={rec.exam_status || '待定'} colors={EXAM_STATUS_COLORS}/>
                        </div>
                      ) : <span style={{ color:'#ccc' }}>—</span>}
                    </td>
                    {[1,2,3].map(n => (
                      <td key={n} style={s.td}>
                        {rec[`interview${n}_date`] ? (
                          <div>
                            <div style={s.dateSmall}>{formatDate(rec[`interview${n}_date`])}</div>
                            <Badge status={rec[`interview${n}_status`] || '待定'} colors={INTERVIEW_STATUS_COLORS}/>
                          </div>
                        ) : <span style={{ color:'#ccc' }}>—</span>}
                      </td>
                    ))}
                    <td style={s.td}>
                      <span style={{ background:'rgba(59,111,160,0.08)', color:status.color, padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button style={s.editBtn} onClick={() => setEditing(rec)}>编辑</button>
                        <button style={s.delBtn} onClick={() => setDeleteId(rec.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
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

      {/* Edit/Add modal */}
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
  container: { maxWidth:1200, margin:'0 auto', padding:'24px 16px', minHeight:'100vh' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 },
  title: { fontSize:26, fontWeight:800, letterSpacing:'-0.5px', margin:0 },
  sub: { fontSize:13, color:'var(--text-muted)', marginTop:4 },
  addBtn: { background:'linear-gradient(135deg,#3B6FA0,#2d5a87)', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:600, boxShadow:'0 2px 8px rgba(59,111,160,0.3)' },
  signOutBtn: { background:'transparent', border:'1.5px solid var(--border)', borderRadius:8, padding:'9px 16px', fontSize:13, color:'var(--text-muted)', fontWeight:500 },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:20 },
  statCard: { background:'#fff', borderRadius:10, padding:'16px 14px', textAlign:'center', boxShadow:'var(--shadow)' },
  statValue: { fontSize:28, fontWeight:800 },
  statLabel: { fontSize:12, color:'var(--text-muted)', marginTop:4, fontWeight:500 },
  filterRow: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' },
  searchInput: { flex:1, minWidth:160, padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', background:'#fff' },
  filterSelect: { padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, background:'#fff', outline:'none' },
  sortBtn: { padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, background:'#fff', fontWeight:600, color:'var(--accent)' },
  tableWrap: { overflowX:'auto', background:'#fff', borderRadius:12, boxShadow:'var(--shadow)' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { textAlign:'left', padding:'14px 12px', fontWeight:700, fontSize:11, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'2px solid var(--bg)', whiteSpace:'nowrap' },
  td: { padding:'12px', borderBottom:'1px solid #f3f4f6', verticalAlign:'middle' },
  typeBadge: { background:'rgba(59,111,160,0.1)', color:'#3B6FA0', padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600, whiteSpace:'nowrap' },
  posBadge: { background:'rgba(123,107,141,0.1)', color:'#7B6B8D', padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600, whiteSpace:'nowrap' },
  dateSmall: { fontSize:11, color:'#aaa', marginBottom:3 },
  empty: { textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:12, boxShadow:'var(--shadow)' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 },
  confirmBox: { background:'#fff', borderRadius:14, padding:28, maxWidth:360, width:'100%', boxShadow:'var(--shadow-lg)' },
  cancelBtn: { background:'#f5f5f5', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600, color:'#666' },
  delBtnLg: { background:'#E57373', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600 },
  editBtn: { background:'transparent', border:'1.5px solid var(--accent)', color:'var(--accent)', borderRadius:6, padding:'4px 12px', fontSize:12, fontWeight:600 },
  delBtn: { background:'transparent', border:'1.5px solid #E57373', color:'#E57373', borderRadius:6, padding:'4px 12px', fontSize:12, fontWeight:600 },
}
