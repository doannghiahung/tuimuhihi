import { NextResponse } from 'next/server';
import { getDB, saveDB } from '../../lib/db';

export async function GET(request) {
  try {
    const db = await getDB();
    
    // 1. Lấy thông tin Client (IP, UUID, User-Agent)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Đọc uuid và fingerprint từ query hoặc headers
    const { searchParams } = new URL(request.url);
    const clientUuid = searchParams.get('uuid') || request.headers.get('x-user-uuid') || '';
    
    // 2. Tăng số lượt truy cập (visitorCount)
    // Để tránh tăng ảo khi reload liên tục, ta có thể bỏ qua nếu trùng IP/UUID trong thời gian ngắn, 
    // hoặc đơn giản là cộng trực tiếp vì đây là troll web, lượt truy cập cao càng vui!
    db.visitorCount = (db.visitorCount || 0) + 1;
    await saveDB(db);

    // 3. Kiểm tra xem người dùng này đã mở túi nào chưa
    let userRecord = null;
    if (clientUuid) {
      userRecord = db.users.find(u => u.uuid === clientUuid);
    }
    
    // Nếu chưa tìm thấy theo UUID, thử tìm theo IP (nếu IP không phải localhost)
    if (!userRecord && clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      userRecord = db.users.find(u => u.ip === clientIp);
    }

    // 4. Chuẩn bị dữ liệu trả về cho 8 túi mù (ẨN mã thẻ nếu không phải chủ sở hữu)
    const sanitizedBags = db.bags.map(bag => {
      const isOwner = userRecord && userRecord.bagId === bag.id;
      return {
        id: bag.id,
        openedBy: bag.openedBy,
        openedAt: bag.openedAt,
        announcedValue: bag.announcedValue,
        maxCards: bag.maxCards,
        // Chỉ trả về cards khi người đó là chủ nhân đã mở túi này
        cards: isOwner ? bag.cards : null
      };
    });

    // 5. Tạo bảng xếp hạng
    // Giá trị công bố có dạng "500.000đ", "200.000đ", v.v. Ta quy đổi về số để sắp xếp
    const parseValue = (valStr) => {
      if (!valStr) return 0;
      const clean = valStr.replace(/[^0-9]/g, '');
      return parseInt(clean, 10) || 0;
    };

    const leaderboard = db.users
      .map(u => {
        const bag = db.bags.find(b => b.id === u.bagId);
        return {
          name: u.name,
          bagId: u.bagId,
          announcedValue: bag ? bag.announcedValue : '5.000đ',
          openedAt: u.openedAt
        };
      })
      .sort((a, b) => parseValue(b.announcedValue) - parseValue(a.announcedValue));

    // 6. Số người tham gia thực tế
    const participantCount = db.users.length;

    return NextResponse.json({
      success: true,
      visitorCount: db.visitorCount,
      participantCount: participantCount,
      bags: sanitizedBags,
      leaderboard: leaderboard,
      currentUser: userRecord ? {
        name: userRecord.name,
        bagId: userRecord.bagId,
        ip: userRecord.ip,
        openedAt: userRecord.openedAt,
        openedBag: sanitizedBags.find(b => b.id === userRecord.bagId)
      } : null
    });

  } catch (error) {
    console.error("API Status Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
