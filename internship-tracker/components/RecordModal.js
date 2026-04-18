'use client'
import { useState } from 'react'
import DatePicker from './DatePicker'

const INTERNSHIP_TYPES = ['日常实习', '暑期实习', '训练营']
const DEFAULT_POSITIONS = ['游戏策划大类', '关卡策划', '系统策划', '任务策划', '叙事策划', '其他岗位']
const INTERVIEW_STATUS = ['待定', '通过', '不通过']
const EXAM_STATUS = ['放弃', '迟交', '待定', '通过', '不通过']

const CHINA_CITIES = ['北京','上海','广州','深圳','杭州','成都','武汉','南京','西安','重庆','天津','苏州','长沙','厦门','青岛','合肥','郑州','济南','大连','宁波','无锡','福州','昆明','哈尔滨','沈阳','贵阳','南昌','太原','石家庄','海口','三亚','其他城市']

const emptyForm = () => ({
  company: '',
  location: '',
  team: '',
  intern_type: INTERNSHIP_TYPES[0],
  position_type: DEFAULT_POSITIONS[0],
  custom_position: '',
  submit_date: null,
  has_exam: '无',
  exam_date: null,
  exam_status: '待定',
  interview1_date: null,
  interview1_status: '待定',
  interview2_date: null,
  interview2_status: '待定',
  interview3_date: null,
  interview3_status: '待定',
})

const EXAM_COLORS = {
  '放弃': { active: { background:'rgba(158,158,158,0.2)', borderColor:'#9E9E9E', color:'#616161' }},
  '迟交': { active: { background:'rgba(255,152,0,0.15)', borderColor:'#FF9800', color:'#E65100' }},
  '待定': { active: { background:'rgba(189,189,189,0.15)', borderColor:'#BDBDBD', color:'#666' }},
  '通过': { active: { background:'rgba(76,175,80,0.15)', borderColor:'#4CAF50', color:'#2E7D32' }},
  '不通过': { active: { background:'rgba(229,115,115,0.15)', borderColor:'#E57373', color:'#C62828' }},
}
const IV_COLORS = {
  '待定': { active: { background:'rgba(189,189,189,0.15)', borderColor:'#BDBDBD', color:'#666' }},
  '通过': { active: { background:'rgba(76,175,80,0.15)', borderColor:'#4CAF50', color:'#2E7D32' }},
  '不通过': { active: { background:'rgba(229,115,115,0.15)', borderColor:'#E57373', color:'#C62828' }},
}

function StatusBtn({ label, selected, colors, onClick }) {
  const base = { flex:1, padding:'6px 4px', border:'1.5px solid #e0e0e0', borderRadius:6, fontSize:11, background:'#fff', fontWeight:600, color:'#aaa', cursor:'pointer', transition:'all 0.15s' }
  const active = colors[label]?.active || {}
  return (
    <button style={selected ? { ...base, ...active } : base} onClick={onClick}>{label}</button>
  )
}

export default function RecordModal({ record, customPositions, onSave, onClose, onAddCustomPosition }) {
  const [form, setForm] = useState(record ? { ...record } : emptyForm())
  const [showAddPos, setShowAddPos] = useState(false)
  const [newPos, setNewPos] = useState('')
  const [saving, setSaving] = useState(false)
  const allPositions = [...DEFAULT_POSITIONS, ...customPositions]

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.company.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const addPos = () => {
    const t = newPos.trim()
    if (t && !allPositions.includes(t)) onAddCustomPosition(t)
    setNewPos(''); setShowAddPos(false)
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h2 style={s.title}>{record ? '编辑记录' : '添加投递记录'}</h2>

        {/* Basic info */}
        <div style={s.grid2}>
          <div style={s.fg}>
            <label style={s.label}>公司名称 *</label>
            <input style={s.input} value={form.company} onChange={e => set('company', e.target.value)} placeholder="输入公司名称"/>
          </div>
          <div style={s.fg}>
            <label style={s.label}>公司地点</label>
            <select style={s.input} value={form.location || ''} onChange={e => set('location', e.target.value)}>
              <option value="">不填</option>
              {CHINA_CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={s.fg}>
            <label style={s.label}>实习类型</label>
            <select style={s.input} value={form.intern_type} onChange={e => set('intern_type', e.target.value)}>
              {INTERNSHIP_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={s.fg}>
            <label style={s.label}>项目组 / 部门</label>
            <input style={s.input} value={form.team || ''} onChange={e => set('team', e.target.value)} placeholder="选填，如：天美L1"/>
          </div>
          <div style={s.fg}>
            <label style={s.label}>
              岗位类型
              <button style={s.addPosBtn} onClick={() => setShowAddPos(!showAddPos)}>＋ 自定义</button>
            </label>
            <select style={s.input} value={form.position_type} onChange={e => set('position_type', e.target.value)}>
              {allPositions.map(p => <option key={p}>{p}</option>)}
            </select>
            {showAddPos && (
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <input style={{ ...s.input, flex:1 }} placeholder="新岗位名称" value={newPos}
                  onChange={e => setNewPos(e.target.value)} onKeyDown={e => e.key==='Enter' && addPos()}/>
                <button style={s.addPosSave} onClick={addPos}>添加</button>
              </div>
            )}
            {form.position_type === '其他岗位' && (
              <input style={{ ...s.input, marginTop:8 }} placeholder="填写具体岗位名称"
                value={form.custom_position} onChange={e => set('custom_position', e.target.value)}/>
            )}
          </div>
          <div style={s.fg}>
            <label style={s.label}>投递时间</label>
            <DatePicker value={form.submit_date} onChange={v => set('submit_date', v)} placeholder="选择投递日期"/>
          </div>
        </div>

        {/* Exam */}
        <div style={s.section}>
          <h3 style={s.sectionTitle}>✏️ 笔试记录</h3>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
            <div style={{ ...s.fg, minWidth:100 }}>
              <label style={s.smallLabel}>笔试记录</label>
              <select style={s.input} value={form.has_exam} onChange={e => set('has_exam', e.target.value)}>
                <option>无</option>
                <option>有</option>
              </select>
            </div>
            {form.has_exam === '有' && (<>
              <div style={{ ...s.fg, minWidth:140 }}>
                <label style={s.smallLabel}>笔试日期</label>
                <DatePicker value={form.exam_date} onChange={v => set('exam_date', v)} placeholder="选择日期"/>
              </div>
              <div style={{ ...s.fg, flex:2, minWidth:220 }}>
                <label style={s.smallLabel}>笔试结果</label>
                <div style={{ display:'flex', gap:4 }}>
                  {EXAM_STATUS.map(st => (
                    <StatusBtn key={st} label={st} selected={form.exam_status === st} colors={EXAM_COLORS}
                      onClick={() => set('exam_status', st)}/>
                  ))}
                </div>
              </div>
            </>)}
          </div>
        </div>

        {/* Interviews */}
        <div style={s.section}>
          <h3 style={s.sectionTitle}>🎤 面试记录</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[1,2,3].map(n => (
              <div key={n} style={s.ivCard}>
                <div style={s.ivLabel}>{['一','二','三'][n-1]}面</div>
                <label style={s.smallLabel}>面试日期</label>
                <DatePicker value={form[`interview${n}_date`]} onChange={v => set(`interview${n}_date`, v)} placeholder="选择日期"/>
                <label style={{ ...s.smallLabel, marginTop:8 }}>面试结果</label>
                <div style={{ display:'flex', gap:4 }}>
                  {INTERVIEW_STATUS.map(st => (
                    <StatusBtn key={st} label={st} selected={form[`interview${n}_status`] === st} colors={IV_COLORS}
                      onClick={() => set(`interview${n}_status`, st)}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.actions}>
          <button style={s.cancelBtn} onClick={onClose}>取消</button>
          <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : record ? '保存修改' : '添加记录'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 },
  modal: { background:'#fff', borderRadius:18, padding:'28px 24px', width:'100%', maxWidth:620, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', animation:'slideUp 0.3s ease' },
  title: { fontSize:20, fontWeight:800, margin:'0 0 20px', color:'var(--text)' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  fg: { display:'flex', flexDirection:'column' },
  label: { fontSize:11, fontWeight:700, color:'var(--accent)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.4px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  smallLabel: { fontSize:11, fontWeight:600, color:'#aaa', marginBottom:4 },
  input: { padding:'9px 12px', border:'1.5px solid #e8e8e8', borderRadius:8, fontSize:13, outline:'none', background:'#fafafa', width:'100%', boxSizing:'border-box' },
  addPosBtn: { background:'none', border:'none', color:'var(--accent)', fontSize:11, fontWeight:700, cursor:'pointer', padding:0 },
  addPosSave: { background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, whiteSpace:'nowrap', cursor:'pointer' },
  section: { marginTop:22, borderTop:'1px solid #f0f0f0', paddingTop:18 },
  sectionTitle: { fontSize:14, fontWeight:700, color:'var(--text)', margin:'0 0 14px' },
  ivCard: { background:'#f8f9fb', borderRadius:10, padding:14 },
  ivLabel: { fontSize:14, fontWeight:700, color:'var(--accent)', marginBottom:10, textAlign:'center' },
  actions: { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 },
  cancelBtn: { background:'#f5f5f5', border:'none', borderRadius:8, padding:'10px 22px', fontSize:13, fontWeight:600, color:'#666', cursor:'pointer' },
  saveBtn: { background:'linear-gradient(135deg,#3B6FA0,#2d5a87)', color:'#fff', border:'none', borderRadius:8, padding:'10px 26px', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(59,111,160,0.3)' },
}
