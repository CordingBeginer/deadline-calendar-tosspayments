// app/api/extract/route.js
// AI 분석 버전에서 호출하는 서버 라우트. Gemini API 키를 브라우저에 노출하지 않고 서버에서만 사용.
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req) {
  const { text, year = 2026 } = await req.json();

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'GEMINI_API_KEY가 설정되지 않았습니다. .env에 키를 추가해주세요.' },
      { status: 400 }
    );
  }

  const prompt = `다음 글에서 과제/시험/발표 등 마감 일정을 모두 찾아 JSON 배열로만 응답해.
형식: [{"title": "일정명", "date": "${year}-MM-DD", "evidence": "원문에서 그대로 발췌한 근거 문장"}]
원문:
"""${text}"""`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const items = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error('[AI 추출 오류]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
