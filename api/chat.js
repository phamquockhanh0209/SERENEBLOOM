
/**
 * SereneBloom - Gemini AI Chat Backend
 * Vercel Serverless Function: /api/chat
 *
 * API key được lưu trong Vercel Environment Variables:
 * GEMINI_API_KEY
 */

const SYSTEM_INSTRUCTION = `
Bạn là SereneBloom AI — người bạn đồng hành chăm sóc sức khỏe tinh thần ấm áp, dịu dàng dành cho học sinh THPT.

NGUYÊN TẮC:
1. Luôn trò chuyện bằng tiếng Việt tự nhiên, ấm áp, thấu cảm, xưng hô "mình" và "bạn".
2. Lắng nghe và công nhận cảm xúc của bạn học sinh, không phán xét, không xem nhẹ nỗi buồn.
3. Đồng hành và hỗ trợ các chủ đề: áp lực thi cử, điểm số, kỳ vọng gia đình, mối quan hệ bạn bè, tâm sinh lý tuổi mới lớn.
4. Đưa ra các gợi ý nhỏ, thực tế và dễ thực hiện (hít thở sâu, uống nước ấm, nghỉ ngơi vài phút).
5. Không chẩn đoán bệnh tâm thần, không tự nhận là bác sĩ hay chuyên gia y tế.
6. Nếu người dùng có nguy cơ tự hại hoặc khủng hoảng nặng, hãy khuyên họ tìm đến người lớn đáng tin cậy (cha mẹ, thầy cô) hoặc liên hệ Tổng đài bảo vệ trẻ em 111 / cấp cứu 115.

LƯU Ý QUAN TRỌNG VỀ ĐỊNH DẠNG:
- Trả lời ngắn gọn, ngắt đoạn rõ ràng, dễ đọc.
- CHỈ TRẢ LỜI TRỰC TIẾP LỜI TÂM SỰ CHO NGƯỜI DÙNG.
- TUYỆT ĐỐI KHÔNG in ra ghi chú nội bộ, quá trình suy nghĩ (thinking), hay các danh sách kiểm tra nguyên tắc (checklist kiểu: "* Lắng nghe? Yes", "* Không bác sĩ? Yes").
`;

// Danh sách model tương thích được hỗ trợ tốt nhất trên tài khoản hiện tại
const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];

export default async function handler(req, res) {
  // Chỉ chấp nhận POST.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed. Please use POST."
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");

      return res.status(503).json({
        error:
          "Gemini chưa được cấu hình. Hãy kiểm tra GEMINI_API_KEY trong Vercel."
      });
    }

    const body = req.body || {};
    const message = body.message;
    const history = body.history;

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Vui lòng nhập tin nhắn."
      });
    }

    if (message.length > 3000) {
      return res.status(400).json({
        error: "Tin nhắn tối đa 3000 ký tự."
      });
    }

    // Xử lý lịch sử trò chuyện.
    const contents = [];

    if (Array.isArray(history)) {
      history
        .filter((item) => {
          return (
            item &&
            typeof item.content === "string" &&
            item.content.trim() &&
            ["user", "ai", "model"].includes(item.role)
          );
        })
        .slice(-10)
        .forEach((item) => {
          contents.push({
            role:
              item.role === "user" ? "user" : "model",
            parts: [
              {
                text: item.content.slice(0, 3000)
              }
            ]
          });
        });
    }

    // Tin nhắn hiện tại chỉ được thêm một lần.
    contents.push({
      role: "user",
      parts: [
        {
          text: message.trim()
        }
      ]
    });

    let reply = "";
    let lastError = null;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800
            }
          })
        });

        const result = await response.json();
        if (response.ok) {
          let rawReply = (result?.candidates?.[0]?.content?.parts || [])
            .map((part) => part.text || "")
            .join("")
            .trim();
          // Lọc bỏ nếu AI vô tình in checklist tự đánh giá nguyên tắc
          rawReply = rawReply
            .replace(/(?:^|\n)\s*(?:\*|-)?\s*[^?\n]+\?\s*(?:Yes|No|Đúng|Sai)\.?/gi, "")
            .replace(/(?:^|\n)\s*(?:Checklist|Thinking|Đánh giá):[^\n]*/gi, "")
            .trim();
          reply = rawReply;
          if (reply) break;
        } else {
          lastError = result?.error?.message || `HTTP ${response.status}`;
          console.warn(`Model ${model} failed, trying fallback:`, lastError);
        }
      } catch (err) {
        lastError = err?.message;
        console.warn(`Model ${model} request error, trying fallback:`, lastError);
      }
    }

    if (!reply) {
      console.error("Gemini failed for all models. Last error:", lastError);
      return res.status(502).json({
        error: "Gemini chưa phản hồi thành công. Bạn vui lòng thử lại sau giây lát."
      });
    }


    return res.status(200).json({
      reply,
      mode: "gemini_live"
    });
  } catch (error) {
    console.error(
      "Chat backend error:",
      error?.message || "Unknown error"
    );

    return res.status(500).json({
      error:
        "Máy chủ gặp lỗi khi xử lý tin nhắn. Vui lòng thử lại."
    });
  }
}
