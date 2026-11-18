'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { downloadIcs } from '../../../lib/ics';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function actualWeekday(y, m, d) {
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

const SAMPLE = `중간고사는 11월 20일(목)에 실시합니다.
과제 2는 11월 25일까지 LMS에 제출합니다.
프로젝트 발표는 12월 22일(화)에 진행됩니다.`;

export default function GeminiWorkspace() {
  const [text, setText] = useState(SAMPLE);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    setIsPremium(localStorage.getItem('user_tier') === 'PREMIUM');
  }, []);

  async function extract() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, year: 2026 }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || '추출에 실패했습니다.');
        setItems([]);
        return;
      }

      const checked = data.items.map((it, i) => {
        const inText = it.evidence && text.includes(it.evidence);
        let note = null;
        let warn = false;

        if (!it.date) {
          warn = true;
          note = '⚠️ 날짜를 추출하지 못했어요. 직접 입력해주세요.';
        } else {
          // 요일 불일치 자동 감지 (2026년 실제 달력 기준 교차 검증)
          const parts = it.date.split('-').map(Number);
          if (parts.length === 3) {
            const [y, m, d] = parts;
            const actual = actualWeekday(y, m, d);

            // 원문 또는 AI 응답에서 명시된 요일 찾기 (예: "목", "(목)", "목요일")
            let stated = it.statedWeekday;
            if (!stated && it.evidence) {
              const parenMatch = it.evidence.match(/\((.)\)/);
              if (parenMatch && WEEKDAYS.includes(parenMatch[1])) {
                stated = parenMatch[1];
              } else {
                const dayMatch = it.evidence.match(/(일|월|화|수|목|금|토)(?:요일)?/);
                if (dayMatch) stated = dayMatch[1];
              }
            }

            if (stated && stated !== actual) {
              warn = true;
              note = `⚠️ 원문은 "${stated}요일"이라 적혀 있지만 실제 2026년은 ${actual}요일이에요. 날짜를 다시 확인해주세요.`;
            }
          }
        }

        // 근거 문장이 원문에 실제로 존재하는지 확인
        if (it.evidence && !inText) {
          warn = true;
          note = (note ? note + ' ' : '') + '⚠️ AI가 제시한 근거 문장이 원문에서 확인되지 않아요.';
        }

        return {
          id: i,
          title: it.title,
          date: it.date || '',
          evidence: it.evidence,
          warn,
          note,
          checked: !warn,
        };
      });

      setItems(checked);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
  }

  function changeDate(id, date) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, date, warn: false, note: null } : it))
    );
  }

  const visible = items.filter((it) => (filter === 'all' ? true : filter === 'warn' ? it.warn : !it.warn));
  const selected = items.filter((it) => it.checked);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: 13, marginRight: 8 }}>← 홈</Link>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>🔴 마감일 캘린더 · AI 분석</h1>
        </div>
        <span
          style={{
            background: isPremium ? '#0064ff' : '#18181b',
            color: '#fff',
            fontSize: 12,
            padding: '6px 14px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {isPremium ? '👑 프리미엄 플랜' : '무료 플랜'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #ececee' }}>
          <h2 style={{ fontSize: 12, color: '#a1a1aa', textTransform: 'uppercase', margin: '0 0 12px' }}>원문 붙여넣기</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              minHeight: 220,
              borderRadius: 14,
              border: '1.5px dashed #d4d4d8',
              padding: 14,
              fontSize: 13.5,
              lineHeight: 1.7,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={extract}
            disabled={loading}
            style={{
              marginTop: 10,
              width: '100%',
              padding: 12,
              background: '#18181b',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '분석 중...' : '✨ 일정 뽑기 (AI 분석)'}
          </button>
          {error && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: '#ef4444', background: '#fef2f2', padding: 10, borderRadius: 10 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #ececee' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all', 'warn', 'ok'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 15px',
                  borderRadius: 999,
                  border: '1px solid #ececee',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filter === f ? '#18181b' : '#fff',
                  color: filter === f ? '#fff' : '#52525b',
                }}
              >
                {f === 'all'
                  ? `전체 ${items.length}`
                  : f === 'warn'
                  ? `확인 필요 ${items.filter((i) => i.warn).length}`
                  : `확인 완료 ${items.filter((i) => !i.warn).length}`}
              </button>
            ))}
          </div>

          {visible.length === 0 && (
            <div style={{ color: '#a1a1aa', textAlign: 'center', padding: 30 }}>
              "일정 뽑기"를 눌러 AI 분석을 시작하세요.
            </div>
          )}

          {visible.map((it) => (
            <div
              key={it.id}
              style={{
                border: '1px solid ' + (it.warn ? '#fee2e2' : '#ececee'),
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                background: it.warn ? '#fffbfa' : '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b style={{ fontSize: 14 }}>{it.title}</b>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: it.warn ? '#fee2e2' : '#f0fdf4',
                    color: it.warn ? '#ef4444' : '#16a34a',
                  }}
                >
                  {it.warn ? '확인 필요' : '확인 완료'}
                </span>
              </div>
              {it.evidence && <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>근거: "{it.evidence}"</div>}
              <div style={{ marginTop: 10 }}>
                📅 <input type="date" value={it.date} onChange={(e) => changeDate(it.id, e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
              </div>
              {it.note && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: '#ef4444', background: '#fef2f2', padding: '8px 10px', borderRadius: 10 }}>
                  {it.note}
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12.5, color: '#71717a', cursor: 'pointer' }}>
                <input type="checkbox" checked={it.checked} onChange={() => toggle(it.id)} /> 캘린더에 포함
              </label>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'sticky',
          bottom: 16,
          marginTop: 16,
          background: '#fff',
          border: '1px solid #ececee',
          borderRadius: 20,
          padding: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,.08)',
        }}
      >
        <span style={{ fontSize: 12.5, color: '#a1a1aa', fontWeight: 700 }}>
          선택됨 {selected.length}건 / 전체 {items.length}건
        </span>
        <button
          onClick={() => downloadIcs(selected)}
          style={{
            padding: '13px 22px',
            background: '#18181b',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          캘린더 파일 저장 (.ics)
        </button>
      </div>
    </main>
  );
}
