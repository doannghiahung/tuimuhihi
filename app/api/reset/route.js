import { NextResponse } from 'next/server';
import { saveDB } from '../../lib/db';

export async function GET(request) {
  try {
    const DEFAULT_CARDS = [
      { code: "3612988430016484", serial: "" },
      { code: "3704707448632871", serial: "" },
      { code: "3369529095325483", serial: "" },
      { code: "2957339673382895", serial: "" },
      { code: "6070395402630917", serial: "" },
      { code: "4696980465093598", serial: "" },
      { code: "381255427606690",  serial: "" },
      { code: "3249080688875815", serial: "" },
      { code: "3690288802777517", serial: "" },
      { code: "5151100021732971", serial: "" },
    ];

    const INITIAL_DB = {
      visitorCount: 0,
      participantCount: 0,
      bags: [
        { id: 1, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[0]], maxCards: 1 },
        { id: 2, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[1]], maxCards: 1 },
        { id: 3, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[2], DEFAULT_CARDS[3]], maxCards: 2 },
        { id: 4, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[4]], maxCards: 1 },
        { id: 5, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[5]], maxCards: 1 },
        { id: 6, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[6], DEFAULT_CARDS[7]], maxCards: 2 },
        { id: 7, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[8]], maxCards: 1 },
        { id: 8, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[9]], maxCards: 1 }
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
