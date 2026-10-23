
/**
 * SereneBloom - Gemini AI Chat Backend
 * Vercel Serverless Function: /api/chat
 *
 * API key được lưu trong Vercel Environment Variables:
 * GEMINI_API_KEY
 */

const SYSTEM_INSTRUCTION = `
Bạn là SereneBloom AI, người bạn đồng hành chăm sóc sức khỏe
tinh thần dành cho học sinh THPT.

NGUYÊN TẮC:
1. Luôn trả lời bằng tiếng Việt tự nhiên, ấm áp, thấu cảm.
2. Xưng hô "mình" và "bạn".
3. Lắng nghe và công nhận cảm xúc của người dùng.
4. Hỗ trợ các chủ đề như áp lực học tập, thi cử, gia đình,
   tình bạn, cảm xúc và những khó khăn tuổi mới lớn.
5. Không chẩn đoán bệnh tâm thần, không tự nhận là bác sĩ
   hoặc chuyên gia tâm lý.
6. Đưa ra gợi ý nhỏ, thực tế và dễ thực hiện khi phù hợp.
7. Không phán xét, không xem nhẹ nỗi buồn của người dùng.
8. Trả lời ngắn gọn, rõ ràng, chia đoạn dễ đọc.
9. Không khẳng định mình là con người hoặc thay thế hỗ trợ
   từ gia đình, thầy cô hay chuyên viên tâm lý.
10. Nếu người dùng đang gặp nguy hiểm hoặc có nguy cơ tự làm
    tổn thương bản thân, hãy phản hồi bình tĩnh, quan tâm,
    khuyến khích họ đến ngay bên người lớn đáng tin cậy và
    tìm trợ giúp khẩn cấp tại địa phương khi cần.
11. Tại Việt Nam, có thể hướng dẫn liên hệ Tổng đài bảo vệ
    trẻ em 111 hoặc cấp cứu 115 trong tình huống khẩn cấp.
12. Trả lời đúng nội dung câu hỏi, không chỉ lặp lại các
    câu trả lời mẫu. Nếu chưa đủ thông tin, hãy hỏi thêm.
`;

// Có thể đổi sang model khác nếu model này không được
// hỗ trợ trong Google AI Studio của tài khoản bạn.
const GEMINI_MODEL = "gemini-2.5-flash";

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

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_INSTRUCTION
            }
          ]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    const result = await response.json();

    // Không trả câu trả lời giả khi API gặp lỗi.
    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        result?.error?.status || "Unknown error",
        result?.error?.message || "No error details"
      );

      return res.status(502).json({
        error:
          "Gemini chưa phản hồi thành công. Hãy kiểm tra model, API key, quyền truy cập và hạn mức."
      });
    }

    const reply = (
      result?.candidates?.[0]?.content?.parts || []
    )
      .map((part) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      console.error(
        "Gemini returned no text",
        result?.promptFeedback?.blockReason || "No text"
      );

      return res.status(502).json({
        error:
          "Gemini không trả về nội dung. Bạn thử gửi lại tin nhắn nhé."
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
