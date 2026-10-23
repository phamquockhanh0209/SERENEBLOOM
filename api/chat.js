/**
 * SereneBloom - Gemini AI Chat Backend Endpoint
 * Deployable on Vercel Serverless Functions (/api/chat)
 * Protects Gemini API Key and enforces empathetic Vietnamese high school psychological guidance.
 */

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is accepted.' });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    if (message.length > 3000) {
      return res.status(400).json({ error: 'Tin nhắn quá dài (tối đa 3000 ký tự).' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Safety & Crisis Detection Prompt for Vietnam High Schoolers
    const systemInstruction = `
Bạn là SereneBloom AI — người bạn đồng hành chăm sóc sức khỏe tinh thần ấm áp, dịu dàng dành cho học sinh THPT (từ 15-18 tuổi).
Nguyên tắc tương tác:
1. Luôn phản hồi bằng tiếng Việt tự nhiên, ấm áp, thấu cảm, xưng hô "mình" và "bạn".
2. Lắng nghe sâu sắc, công nhận cảm xúc của bạn học sinh (áp lực điểm số, thi cử, kỳ vọng gia đình, mối quan hệ bạn bè, tuổi mới lớn). Không phán xét, không gạt bỏ cảm xúc.
3. Tuyệt đối KHÔNG chẩn đoán bệnh lý tâm thần hoặc tự nhận là bác sĩ/chuyên gia tâm lý.
4. Gợi ý các bước tự chăm sóc đơn giản, dễ làm ngay: hít thở sâu, uống nước ấm, nghỉ ngơi 5 phút, nghe nhạc dịu, viết nhật ký.
5. Nếu nhận thấy bạn học sinh đang ở trong trạng thái khủng hoảng nghiêm trọng, kiệt quệ, có ý nghĩ tự hại hoặc bế tắc cùng cực:
   - Thể hiện sự trân trọng và lo lắng chân thành cho sự an toàn của bạn.
   - Nhắc nhở dịu dàng rằng bạn không đơn độc và việc tìm kiếm sự trợ giúp từ người lớn đáng tin cậy (cha mẹ, thầy cô, chuyên viên tư vấn học đường) là bước đi dũng cảm.
   - Cung cấp thông tin đường dây nóng hỗ trợ miễn phí tại Việt Nam:
     * Tổng đài Quốc gia Bảo vệ Trẻ em & Thanh thiếu niên: 111 (miễn phí 24/7)
     * Đường dây nóng Ngày Mai (Hỗ trợ người trầm cảm & khủng hoảng tâm lý): 096 306 1414
     * Cấp cứu khẩn cấp: 115.
6. Giữ câu trả lời súc tích, ngắt đoạn rõ ràng, không nói quá dài khiến người đọc thêm mệt mỏi.
`;

    // Format chat history for Gemini API
    const contents = [
      {
        role: "user",
        parts: [{ text: systemInstruction }]
      },
      {
        role: "model",
        parts: [{ text: "Mình đã hiểu và sẵn sàng đồng hành, lắng nghe các bạn học sinh với sự chân thành, ấm áp nhất." }]
      }
    ];

    // Add conversation history
    if (Array.isArray(history)) {
      history.filter(msg => msg && typeof msg.content === 'string').slice(-10).forEach(msg => {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Do not pretend a scripted response is a live Gemini answer.
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not configured.");
      return res.status(503).json({ error: 'Gemini chưa được cấu hình. Hãy thêm GEMINI_API_KEY trong Vercel → Settings → Environment Variables rồi triển khai lại.' });
    }

    // Use gemini-3.5-flash-lite (fast, responsive, latest Google AI release)

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800
        }
      })
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.text();
      console.error("Gemini API Error:", errData);
      return res.status(502).json({
        error: 'Gemini API từ chối yêu cầu hoặc model hiện không khả dụng. Kiểm tra API key, quyền truy cập và hạn mức trong Google AI Studio.'
      });
    }

    const data = await geminiRes.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Mình luôn ở đây lắng nghe bạn. Bạn hãy chia sẻ thêm nhé!";

    return res.status(200).json({ reply: replyText, mode: 'gemini_live' });

  } catch (error) {
    console.error("Chat Handler Exception:", error);
    return res.status(500).json({
      error: "Internal server error",
      reply: "Mình gặp chút trục trặc khi kết nối, nhưng mình vẫn luôn ở đây cùng bạn. Bạn có muốn hít thở một hơi thật sâu rồi thử lại không?"
    });
  }
}

