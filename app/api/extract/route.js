import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req) {
  try {
    const { text, year = 2026 } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'GEMINI_API_KEY가 설정되지 않았습니다. .env에 키를 추가해주세요.' },
        { status: 400 }
      );
    }

    const prompt = `다음 글에서 과제/시험/발표 등 마감 일정을 모두 찾아 JSON 배열로만 응답해.
각 항목은 {"title": "일정명", "date": "${year}-MM-DD 또는 빈문자열", "statedWeekday": "원문에 적힌 요일(월~일 중 한글자 또는 null)", "evidence": "원문에서 그대로 발췌한 근거 문장"} 형식이야.
날짜를 특정할 수 없으면 date는 ""로 둬.
기준 연도는 ${year}년이야.
원문:
"""${text}"""`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.error?.message || 'Gemini API 호출 실패' },
        { status: res.status }
      );
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const items = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error('[AI 추출 오류]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
