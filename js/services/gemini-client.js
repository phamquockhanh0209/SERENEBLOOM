
/**
 * SereneBloom - Gemini Chat Client Service
 * Gọi Gemini thông qua backend /api/chat.
 * Không tự động chuyển sang câu trả lời mẫu khi API lỗi.
 */

export async function sendMessageToGemini(message, history = []) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data.error || `Backend trả về HTTP ${res.status}`
      );
    }

    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("Backend không trả về nội dung reply.");
    }

    console.log("SereneBloom AI mode:", data.mode || "unknown");

    return data.reply.trim();
  } catch (error) {
    console.error("SereneBloom Gemini error:", error);

    // Báo lỗi thật, không trả về câu trả lời mẫu.
    throw error;
  }
}
