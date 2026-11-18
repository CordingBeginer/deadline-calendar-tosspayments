'use client';
import { useState } from 'react';
import { downloadIcs } from '../../../lib/ics';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function actualWeekday(y, m, d) { return WEEKDAYS[new Date(y, m - 1, d).getDay()]; }

const SAMPLE = `1주차 ~ 2주차: 이산시간 신호와 시스템의 성질
3주차: 중간고사 범위는 1~5장이며, 시험은
11월 20일(목) 오후 2시에 공학관 401호에서 실시합니다.

과제 2(MATLAB 필터) 설계는 11월 25일까지 LMS에 제출하며,
지연 제출 시 일당 10% 감점이 적용됩니다.

프로젝트 발표는 12월 22일(화) 수업 시간에 진행됩니다.
퀴즈 1은 11월 6일(금)에 온라인으로 진행됩니다.`;

export default function OfflineWorkspace() {
  const [text, setText] = useState(SAMPLE);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  function extract() {
    const year = 2026;
    const regex = /(\d{1,2})월\s?(\d{1,2})일(?:\((.)\))?/g;
    const found = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      const month = parseInt(m[1], 10);
      const day = parseInt(m[2], 10);
      const stated = m[3] || null;
      const idx = m.index;
      const context = text.slice(Math.max(0, idx - 20), idx).replace(/\n/g, ' ').trim();
      const title = context ? context.slice(-16) + '…' : '일정';
      const actual = actualWeekday(year, month, day);
      const mismatch = stated && stated !== actual;
      found.push({
        id: found.length,
        title,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        warn: !!mismatch,
        note: mismatch ? `⚠️ "${month}월 ${day}일(${stated})"라고 적혀 있지만 실제로는 ${actual}요일이에요.` : null,
        checked: !mismatch,
      });
    }
    setItems(found);
  }

  function toggle(id) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
  }
  function changeDate(id, date) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, date, warn: false, note: null } : it)));
  }

  const visible = items.filter((it) => (filter === 'all' ? true : filter === 'warn' ? it.warn : !it.warn));
  const selected = items.filter((it) => it.checked);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 17, fontWeight: 800 }}>🔴 마감일 캘린더 · 오프라인 분석</h1>
        <span style={{ background: '#18181b', color: '#fff', fontSize: 12, padding: '6px 14px', borderRadius: 999 }}>무료 플랜</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #ececee' }}>
          <h2 style={{ fontSize: 12, color: '#a1a1aa', textTransform: 'uppercase' }}>원문 붙여넣기</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', minHeight: 220, borderRadius: 14, border: '1.5px dashed #d4d4d8', padding: 14, fontSize: 13.5, lineHeight: 1.7 }}
          />
          <button onClick={extract} style={{ marginTop: 10, width: '100%', padding: 12, background: '#18181b', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800 }}>
            ✨ 일정 뽑기 (오프라인 분석)
          </button>
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #ececee' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all', 'warn', 'ok'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 15px', borderRadius: 999, border: '1px solid #ececee', fontSize: 12.5, fontWeight: 700,
                background: filter === f ? '#18181b' : '#fff', color: filter === f ? '#fff' : '#52525b',
              }}>
                {f === 'all' ? `전체 ${items.length}` : f === 'warn' ? `확인 필요 ${items.filter((i) => i.warn).length}` : `확인 완료 ${items.filter((i) => !i.warn).length}`}
              </button>
            ))}
          </div>
          {visible.length === 0 && <div style={{ color: '#a1a1aa', textAlign: 'center', padding: 30 }}>일정을 뽑아보세요.</div>}
          {visible.map((it) => (
            <div key={it.id} style={{ border: '1px solid ' + (it.warn ? '#fee2e2' : '#ececee'), borderRadius: 16, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b style={{ fontSize: 14 }}>{it.title}</b>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: it.warn ? '#fee2e2' : '#f0fdf4', color: it.warn ? '#ef4444' : '#16a34a' }}>
                  {it.warn ? '확인 필요' : '확인 완료'}
                </span>
              </div>
              <div style={{ marginTop: 10 }}>
                📅 <input type="date" value={it.date} onChange={(e) => changeDate(it.id, e.target.value)} />
              </div>
              {it.note && <div style={{ marginTop: 8, fontSize: 12.5, color: '#ef4444', background: '#fef2f2', padding: '8px 10px', borderRadius: 10 }}>{it.note}</div>}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12.5, color: '#71717a' }}>
                <input type="checkbox" checked={it.checked} onChange={() => toggle(it.id)} /> 캘린더에 포함
              </label>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'sticky', bottom: 16, marginTop: 16, background: '#fff', border: '1px solid #ececee', borderRadius: 20, padding: 18, display: 'flex', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
        <span style={{ fontSize: 12.5, color: '#a1a1aa', fontWeight: 700 }}>선택됨 {selected.length}건 / 전체 {items.length}건</span>
        <button onClick={() => downloadIcs(selected)} style={{ padding: '13px 22px', background: '#18181b', color: '#fff', border: 'none', borderRadius: 999, fontWeight: 800 }}>
          캘린더 파일 저장 (.ics)
        </button>
      </div>
    </main>
  );
}
