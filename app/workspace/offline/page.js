'use client';
import { useState } from 'react';
import Link from 'next/link';
import { downloadIcs } from '../../../lib/ics';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function actualWeekday(y, m, d) {
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

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
        note: mismatch
          ? `⚠️ 원문에는 (${stated})요일로 적혀 있지만, 2026년 실제 달력은 ${actual}요일입니다.`
          : null,
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
    <main style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 20px 48px' }}>
      {/* 상단 네비게이션 & 타이틀 바 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/"
            style={{
              color: '#71717a',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: 8,
              background: '#ffffff',
              border: '1px solid #e4e4e7',
            }}
          >
            ← 홈으로
          </Link>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              letterSpacing: '-0.3px',
            }}
          >
            ⚡ 마감일 캘린더 · 오프라인 분석
          </h1>
        </div>
        <span
          style={{
            background: '#18181b',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: 999,
          }}
        >
          무료 플랜
        </span>
      </div>

      {/* 좌우 2열 그리드 레이아웃 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.25fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* 좌측: 원문 입력 패널 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: 24,
            border: '1px solid #ececee',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase',
              marginBottom: 12,
              letterSpacing: '0.5px',
            }}
          >
            원문 붙여넣기
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="강의계획서나 공지 문구를 붙여넣으세요..."
            style={{
              width: '100%',
              minHeight: 250,
              borderRadius: 14,
              border: '1.5px dashed #d4d4d8',
              padding: '16px',
              fontSize: 14,
              lineHeight: 1.75,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              resize: 'vertical',
              outline: 'none',
              color: '#18181b',
              background: '#fafafa',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#18181b';
              e.target.style.background = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d4d4d8';
              e.target.style.background = '#fafafa';
            }}
          />
          <button
            type="button"
            onClick={extract}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '14px 0',
              background: '#18181b',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14.5,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            ✨ 일정 뽑기 (오프라인 분석)
          </button>
        </div>

        {/* 우측: 추출된 일정 목록 및 수정 패널 */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: 24,
            border: '1px solid #ececee',
            minHeight: 340,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          {/* 필터 버튼 영역 */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 18,
              alignItems: 'center',
            }}
          >
            {[
              { key: 'all', label: `전체 ${items.length}` },
              { key: 'warn', label: `확인 필요 ${items.filter((i) => i.warn).length}` },
              { key: 'ok', label: `확인 완료 ${items.filter((i) => !i.warn).length}` },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '7px 15px',
                  borderRadius: 999,
                  border: '1px solid ' + (filter === f.key ? '#18181b' : '#e4e4e7'),
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filter === f.key ? '#18181b' : '#ffffff',
                  color: filter === f.key ? '#ffffff' : '#71717a',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 일정 없는 경우 빈 상태 표시 */}
          {visible.length === 0 && (
            <div
              style={{
                color: '#a1a1aa',
                textAlign: 'center',
                padding: '64px 20px',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {items.length === 0
                ? '왼쪽의 "일정 뽑기" 버튼을 누르면 마감 일정이 추출됩니다.'
                : '해당 조건의 일정이 없습니다.'}
            </div>
          )}

          {/* 일정 카드 목록 */}
          {visible.map((it) => (
            <div
              key={it.id}
              style={{
                border: '1px solid ' + (it.warn ? '#fecaca' : '#ececee'),
                borderRadius: 16,
                padding: 18,
                marginBottom: 12,
                background: it.warn ? '#fffbfa' : '#ffffff',
                boxShadow: it.warn ? '0 2px 8px rgba(239,68,68,0.04)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#18181b' }}>
                  {it.title}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
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

              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: '#52525b',
                }}
              >
                <span style={{ fontWeight: 600 }}>📅 날짜:</span>
                <input
                  type="date"
                  value={it.date}
                  onChange={(e) => changeDate(it.id, e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #d4d4d8',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#18181b',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                />
              </div>

              {it.note && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12.5,
                    color: '#ef4444',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    padding: '8px 12px',
                    borderRadius: 10,
                    lineHeight: 1.45,
                  }}
                >
                  {it.note}
                </div>
              )}

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 12,
                  fontSize: 13,
                  color: '#52525b',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={it.checked}
                  onChange={() => toggle(it.id)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#18181b' }}
                />
                <span>캘린더에 포함</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 고정 액션 바 */}
      <div
        style={{
          position: 'sticky',
          bottom: 16,
          marginTop: 22,
          background: '#ffffff',
          border: '1px solid #ececee',
          borderRadius: 20,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          zIndex: 20,
        }}
      >
        <span style={{ fontSize: 13, color: '#71717a', fontWeight: 700 }}>
          선택됨 {selected.length}건 / 전체 {items.length}건
        </span>
        <button
          type="button"
          onClick={() => downloadIcs(selected)}
          disabled={selected.length === 0}
          style={{
            padding: '12px 24px',
            background: '#18181b',
            color: '#ffffff',
            border: 'none',
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 13.5,
            cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
            opacity: selected.length === 0 ? 0.4 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          📅 캘린더 파일 저장 (.ics)
        </button>
      </div>
    </main>
  );
}
