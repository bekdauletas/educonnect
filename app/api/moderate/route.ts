import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Ты модератор школьного чата. Проверь это сообщение на агрессию, грубость, оскорбления или неуважение. Ответь только "SAFE" если сообщение нормальное, или "UNSAFE" если содержит недопустимый контент. Сообщение: "${text}"`
            }]
          }]
        })
      }
    )

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'SAFE'
    const isSafe = !result.includes('UNSAFE')

    return NextResponse.json({ isSafe })
  } catch {
    return NextResponse.json({ isSafe: true })
  }
}