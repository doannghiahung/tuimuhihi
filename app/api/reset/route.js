import { NextResponse } from 'next/server';
import { saveDB, INITIAL_DB } from '../../lib/db';

export async function GET(request) {
  try {
    await saveDB(INITIAL_DB);
    
    return NextResponse.json({
      success: true,
      message: "Database đã được reset thành công về trạng thái ban đầu! Cả 12 túi mù đều trống và sẵn sàng được khui."
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
