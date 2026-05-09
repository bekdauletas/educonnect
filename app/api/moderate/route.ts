import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Ты строгий модератор школьного чата между учителями и родителями. Проверь это сообщение на:
- Грубость, оскорбления, мат
- Угрозы, агрессию, токсичность
- Неуважение к учителям или другим родителям
- Сексуальный контент, аморальные темы
- Политику, экстремизм, дискриминацию
- Спам, рекламу

ВАЖНО: Школьный чат должен быть МАКСИМАЛЬНО уважительным и профессиональным.

Сообщение: "${text}"

Ответь ТОЛЬКО одним словом:
- "SAFE" если сообщение корректное и уважительное
- "UNSAFE" если есть хоть малейшее нарушение

Ответ:`
            }]
          }]
        })
      }
    )

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'SAFE'
    const isSafe = result.trim().toUpperCase().includes('SAFE') && !result.trim().toUpperCase().includes('UNSAFE')

    return NextResponse.json({ isSafe, reason: result })
  } catch (error) {
    console.error('Gemini API error:', error)
    // В случае ошибки API — блокируем на всякий случай
    return NextResponse.json({ isSafe: false, reason: 'API error' })
  }
}