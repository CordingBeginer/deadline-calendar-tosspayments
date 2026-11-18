// lib/ics.js - 선택된 일정으로 .ics 파일 생성
export function buildIcs(events) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//deadline-app//KO'];
  events.forEach((ev, i) => {
    const d = (ev.date || '').replace(/-/g, '');
    if (!d) return;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${Date.now()}-${i}@deadline-app`,
      `DTSTART;VALUE=DATE:${d}`,
      `SUMMARY:${ev.title}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(events, filename = 'schedule.ics') {
  const content = buildIcs(events);
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
