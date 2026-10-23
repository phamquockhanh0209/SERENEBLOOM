
/**
 * SereneBloom - Gemini Chat Client Service
 * Gọi Gemini thông qua backend bảo mật tại /api/chat.
 */

const SYSTEM_INSTRUCTION = `
Bạn là SereneBloom AI — người bạn đồng hành chăm sóc sức khỏe tinh thần
ấm áp dành cho học sinh THPT.

Nguyên tắc:
1. Phản hồi bằng tiếng Việt tự nhiên, dịu dàng, xưng hô mình - bạn.
2. Lắng nghe và công nhận cảm xúc, không phán xét.
3. Không chẩn đoán bệnh lý hoặc tự nhận là bác sĩ.
4. Gợi ý các bước chăm sóc bản thân đơn giản, phù hợp.
5. Nếu người dùng có nguy cơ gặp nguy hiểm, khuyến khích họ báo ngay
   cho người lớn đáng tin cậy và tìm hỗ trợ khẩn cấp khi cần.
6. Trả lời ngắn gọn, rõ ràng, không khiến người đọc thêm mệt mỏi.
`;

export async function sendMessageToGemini(message, history = []) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history,
        systemInstruction: SYSTEM_INSTRUCTION
      })
    });

    if (!res.ok) {
      throw new Error(`Backend trả về HTTP ${res.status}`);
    }

    const data = await res.json();

    if (typeof data.reply === "string" && data.reply.trim()) {
      return data.reply;
    }

    throw new Error("Backend không trả về nội dung reply.");
  } catch (error) {
    console.error("SereneBloom chat error:", error);
    return getLocalCompanionResponse(message);
  }
}

function getLocalCompanionResponse(msg) {
  const lower = String(msg || "").toLowerCase();

  if (
    lower.includes("tự hại") ||
    lower.includes("tự tử") ||
    lower.includes("không muốn sống") ||
    lower.includes("không muốn tồn tại")
  ) {
    return `Mình rất tiếc vì bạn đang phải trải qua những cảm xúc nặng nề này.
Bạn không cần phải đối mặt một mình. Hãy tìm một người lớn đáng tin cậy,
như cha mẹ, thầy cô hoặc chuyên viên tư vấn học đường, và nói với họ
điều bạn đang trải qua nhé. Nếu bạn đang gặp nguy hiểm ngay lúc này,
hãy đến bên một người có thể giúp bạn ngay lập tức. Tại Việt Nam,
bạn có thể gọi 111 để được hỗ trợ bảo vệ trẻ em.`;
  }

  if (
    lower.includes("thi") ||
    lower.includes("học") ||
    lower.includes("áp lực") ||
    lower.includes("điểm số") ||
    lower.includes("bài tập")
  ) {
    return `Mình hiểu áp lực học tập đôi khi có thể khiến bạn mệt mỏi.
Bạn thử nghỉ vài phút, uống chút nước và hít thở chậm nhé.
Điều gì đang khiến bạn áp lực nhất lúc này?`;
  }

  if (
    lower.includes("buồn") ||
    lower.includes("khóc") ||
    lower.includes("cô đơn") ||
    lower.includes("tủi thân")
  ) {
    return `Mình đang lắng nghe bạn. Bạn không cần phải ép mình vui lên ngay.
Nếu bạn thấy thoải mái, hãy kể thêm điều gì đang khiến bạn buồn nhé.`;
  }

  if (
    lower.includes("mệt") ||
    lower.includes("đuối") ||
    lower.includes("chán")
  ) {
    return `Có vẻ bạn đang trải qua một ngày khá mệt mỏi.
Bạn có thể tạm nghỉ một chút và cho bản thân thời gian hồi sức.
Bạn muốn chia sẻ điều gì làm mình mệt nhất không?`;
  }

  return `Cảm ơn bạn đã chia sẻ cùng SereneBloom.
Mình sẵn sàng lắng nghe bạn. Hôm nay bạn đang cảm thấy thế nào?`;
}
