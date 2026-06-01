import { NextResponse } from 'next/server';
import { getDB, saveDB } from '../../lib/db';

export async function POST(request) {
  try {
    const db = await getDB();
    
    // 1. Lấy thông tin từ request body
    const body = await request.json();
    const { bagId, name, uuid, fingerprint } = body;
    
    // Kiểm tra đầu vào
    if (!bagId || !name || !uuid) {
      return NextResponse.json({ 
        success: false, 
        error: "Thiếu dữ liệu! Nhập tên đàng hoàng rồi mới mở được nha bạn hiền." 
      }, { status: 400 });
    }

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: "Tên ngắn quá vậy! Đặt tên nào dài hơn 2 ký tự và bựa tí đi." 
      }, { status: 400 });
    }

    const targetBagId = parseInt(bagId, 10);
    const bag = db.bags.find(b => b.id === targetBagId);
    if (!bag) {
      return NextResponse.json({ 
        success: false, 
        error: "Túi mù không tồn tại! Đừng hack web nha." 
      }, { status: 400 });
    }

    // 2. Kiểm tra túi đã bị mở chưa
    if (bag.openedBy) {
      return NextResponse.json({ 
        success: false, 
        error: `Túi mù này đã bị cướp bởi [${bag.openedBy}] rồi! Chọn túi khác đi fen.` 
      }, { status: 400 });
    }

    // 3. Lấy thông tin IP của Client
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');

    // 4. KIỂM TRA CHỐNG GIAN LẬN: 1 IP/Thiết bị chỉ được mở 1 túi
    let existingUser = db.users.find(u => u.uuid === uuid);
    
    // Thử check theo IP nếu không phải localhost
    if (!existingUser && clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      existingUser = db.users.find(u => u.ip === clientIp);
    }

    if (existingUser) {
      const openedBag = db.bags.find(b => b.id === existingUser.bagId);
      return NextResponse.json({ 
        success: false, 
        isDuplicateUser: true,
        openedBagId: existingUser.bagId,
        error: `Tham lam thế bạn ơi! IP/Thiết bị của bạn đã mở túi số [Túi ${existingUser.bagId}] với tên [${existingUser.name}] rồi! Đức Anh không cho mở cái thứ hai đâu nha.` 
      }, { status: 400 });
    }

    // 5. Kiểm tra trùng tên (Không cho phép 2 người trùng tên nhau trên web)
    const isNameTaken = db.users.some(u => u.name.toLowerCase() === cleanName.toLowerCase());
    if (isNameTaken) {
      return NextResponse.json({ 
        success: false, 
        error: `Tên [${cleanName}] đã có người đẹp trai/xinh gái khác giành trước rồi! Hãy nhập một cái tên khác độc lạ và bựa hơn đi.` 
      }, { status: 400 });
    }

    // 6. Quyết định giá trị Troll (announced value) để lừa người chơi!
    // Các mức giá trị troll: 20k, 50k, 100k, 200k, 500k
    // Nếu là túi có 2 thẻ (nhân đôi niềm vui), ta cho trúng mức 500k (Siêu Cấp) hoặc 200k.
    // Nếu là túi 1 thẻ, random ngẫu nhiên các mức từ 20k - 500k.
    const trollValuesSingle = ["20.000đ", "50.000đ", "100.000đ", "200.000đ", "500.000đ"];
    const trollValuesDouble = ["200.000đ (Gói Đôi)", "500.000đ (Gói Siêu Cấp)"];
    
    let announcedValue = "";
    if (bag.maxCards === 2) {
      announcedValue = trollValuesDouble[Math.floor(Math.random() * trollValuesDouble.length)];
    } else {
      // Cho tỷ lệ trúng 200k và 500k cao hơn để troll cho sướng!
      const rand = Math.random();
      if (rand < 0.4) {
        announcedValue = "500.000đ";
      } else if (rand < 0.7) {
        announcedValue = "200.000đ";
      } else if (rand < 0.85) {
        announcedValue = "100.000đ";
      } else if (rand < 0.95) {
        announcedValue = "50.000đ";
      } else {
        announcedValue = "20.000đ";
      }
    }

    // 7. Cập nhật túi mù
    bag.openedBy = cleanName;
    bag.openedAt = new Date().toISOString();
    bag.announcedValue = announcedValue;

    // 8. Lưu thông tin User mới
    const newUser = {
      name: cleanName,
      bagId: targetBagId,
      ip: clientIp,
      uuid: uuid,
      openedAt: new Date().toISOString()
    };
    db.users.push(newUser);
    
    // Cập nhật số người tham gia
    db.participantCount = db.users.length;

    // Lưu cơ sở dữ liệu
    await saveDB(db);

    // Trả về kết quả thành công và mã thẻ
    return NextResponse.json({
      success: true,
      bagId: bag.id,
      name: cleanName,
      announcedValue: announcedValue,
      cards: bag.cards // Trả về mã thẻ thật ở đây
    });

  } catch (error) {
    console.error("API Open Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
