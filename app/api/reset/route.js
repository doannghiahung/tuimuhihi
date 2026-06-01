import { NextResponse } from 'next/server';
import { saveDB } from '../../lib/db';

export async function GET(request) {
  try {
    const DEFAULT_CARDS = [
      { code: "10006382910482", serial: "GP4829103847" },
      { code: "10007492019482", serial: "GP9284710492" },
      { code: "10008472910483", serial: "GP8374920184" },
      { code: "10009284710485", serial: "GP2847104928" },
      { code: "10001048291847", serial: "GP1038471048" },
      { code: "10002938471029", serial: "GP9284710294" },
      { code: "10003847192847", serial: "GP3847102948" },
      { code: "10004829104827", serial: "GP4810294810" },
      { code: "10005820194820", serial: "GP5820194820" },
      { code: "10006830194810", serial: "GP6830194810" },
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
