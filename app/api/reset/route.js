import { NextResponse } from 'next/server';
import { saveDB } from '../../lib/db';

export async function GET(request) {
  try {
    const DEFAULT_CARDS = [
      { code: "3612988430016484", serial: "" }, // Thẻ 1
      { code: "3704707448632871", serial: "" }, // Thẻ 2
      { code: "3369529095325483", serial: "" }, // Thẻ 3
      { code: "2957339673382895", serial: "" }, // Thẻ 4
      { code: "6070395402630917", serial: "" }, // Thẻ 5
      { code: "4696980465093598", serial: "" }, // Thẻ 6
      { code: "3812555427606690", serial: "" }, // Thẻ 7
      { code: "3249080688875815", serial: "" }, // Thẻ 8
      { code: "3690288802777517", serial: "" }, // Thẻ 9
      { code: "5151100021732971", serial: "" }, // Thẻ 10
      { code: "5433038836324305", serial: "" }, // Thẻ 11
      { code: "6613123431841853", serial: "" }, // Thẻ 12
      { code: "3683790102754610", serial: "" }, // Thẻ 13
      { code: "7344683234301052", serial: "" }, // Thẻ 14
      { code: "2488086544181484", serial: "" }, // Thẻ 15
      { code: "0817063863655402", serial: "" }, // Thẻ 16
      { code: "1742083994160005", serial: "" }, // Thẻ 17
      { code: "6576027133440837", serial: "" }, // Thẻ 18
      { code: "9172569618347428", serial: "" }, // Thẻ 19
      { code: "3368494088980451", serial: "" }  // Thẻ 20
    ];

    const INITIAL_DB = {
      visitorCount: 0,
      participantCount: 0,
      bags: [
        { id: 1, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[0]], maxCards: 1 },
        { id: 2, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[1]], maxCards: 1 },
        { id: 3, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[2], DEFAULT_CARDS[3]], maxCards: 2 }, // Túi 2 thẻ
        { id: 4, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[4]], maxCards: 1 },
        { id: 5, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[5]], maxCards: 1 },
        { id: 6, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[6]], maxCards: 1 },
        { id: 7, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[7], DEFAULT_CARDS[8]], maxCards: 2 }, // Túi 2 thẻ
        { id: 8, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[9]], maxCards: 1 },
        { id: 9, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[10]], maxCards: 1 },
        { id: 10, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[11]], maxCards: 1 },
        { id: 11, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[12], DEFAULT_CARDS[13]], maxCards: 2 }, // Túi 2 thẻ
        { id: 12, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[14]], maxCards: 1 },
        { id: 13, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[15]], maxCards: 1 },
        { id: 14, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[16]], maxCards: 1 },
        { id: 15, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[17], DEFAULT_CARDS[18]], maxCards: 2 }, // Túi 2 thẻ
        { id: 16, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[19]], maxCards: 1 }
      ],
      users: []
    };

    await saveDB(INITIAL_DB);
    
    return NextResponse.json({
      success: true,
      message: "Database đã được reset thành công về trạng thái ban đầu! Cả 8 túi mù đều trống và sẵn sàng được khui."
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
