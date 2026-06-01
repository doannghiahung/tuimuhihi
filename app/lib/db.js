import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'database.json');

// Danh sách 10 mã thẻ Garena 5k mặc định (bạn có thể thay thế bằng thẻ thật)
const DEFAULT_CARDS = [
  { code: "10006382910482", serial: "GP4829103847" }, // Thẻ 1 (Túi 1)
  { code: "10007492019482", serial: "GP9284710492" }, // Thẻ 2 (Túi 2)
  { code: "10008472910483", serial: "GP8374920184" }, // Thẻ 3 (Túi 3 - thẻ 1)
  { code: "10009284710485", serial: "GP2847104928" }, // Thẻ 4 (Túi 3 - thẻ 2)
  { code: "10001048291847", serial: "GP1038471048" }, // Thẻ 5 (Túi 4)
  { code: "10002938471029", serial: "GP9284710294" }, // Thẻ 6 (Túi 5)
  { code: "10003847192847", serial: "GP3847102948" }, // Thẻ 7 (Túi 6 - thẻ 1)
  { code: "10004829104827", serial: "GP4810294810" }, // Thẻ 8 (Túi 6 - thẻ 2)
  { code: "10005820194820", serial: "GP5820194820" }, // Thẻ 9 (Túi 7)
  { code: "10006830194810", serial: "GP6830194810" }, // Thẻ 10 (Túi 8)
];

const INITIAL_DB = {
  visitorCount: 0,
  participantCount: 0,
  bags: [
    { id: 1, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[0]], maxCards: 1 },
    { id: 2, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[1]], maxCards: 1 },
    { id: 3, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[2], DEFAULT_CARDS[3]], maxCards: 2 }, // Túi có 2 thẻ
    { id: 4, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[4]], maxCards: 1 },
    { id: 5, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[5]], maxCards: 1 },
    { id: 6, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[6], DEFAULT_CARDS[7]], maxCards: 2 }, // Túi có 2 thẻ
    { id: 7, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[8]], maxCards: 1 },
    { id: 8, openedBy: null, openedAt: null, announcedValue: null, cards: [DEFAULT_CARDS[9]], maxCards: 1 }
  ],
  users: []
};

// Biến lưu trữ tạm thời nếu chạy serverless mà không có DB bên ngoài
let memoryDb = null;

// Hàm kiểm tra xem có biến môi trường Vercel KV không
function getVercelKVConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return { url, token };
  }
  return null;
}

// Gọi API Vercel KV bằng fetch REST
async function fetchKV(command, ...args) {
  const config = getVercelKVConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/${command}/${args.join('/')}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: 'no-store'
    });
    if (!response.ok) {
      console.error("Vercel KV REST API Error:", response.statusText);
      return null;
    }
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Failed to fetch Vercel KV:", error);
    return null;
  }
}

// Lưu trữ KV phức tạp bằng JSON stringify/parse
async function getKVData() {
  const config = getVercelKVConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/get/garena_tui_mu_db`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: 'no-store'
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.result) {
      return JSON.parse(data.result);
    }
    return null;
  } catch (error) {
    console.error("Failed to get KV Data:", error);
    return null;
  }
}

async function setKVData(data) {
  const config = getVercelKVConfig();
  if (!config) return false;

  try {
    const response = await fetch(`${config.url}/set/garena_tui_mu_db`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(data)),
      cache: 'no-store'
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to set KV Data:", error);
    return false;
  }
}

export async function getDB() {
  // 1. Nếu có Vercel KV (Môi trường deploy thực tế trên Vercel)
  const kvConfig = getVercelKVConfig();
  if (kvConfig) {
    let data = await getKVData();
    if (!data) {
      // Khởi tạo DB trên KV nếu chưa có
      await setKVData(INITIAL_DB);
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }
    return data;
  }

  // 2. Chạy ở máy local: Đọc file database.json
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileContent = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(fileContent);
    } else {
      // Khởi tạo file local
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf8');
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }
  } catch (err) {
    console.error("Local DB read failed, using memory DB:", err);
    // 3. Fallback dùng memory DB
    if (!memoryDb) {
      memoryDb = JSON.parse(JSON.stringify(INITIAL_DB));
    }
    return memoryDb;
  }
}

export async function saveDB(data) {
  // 1. Lưu lên Vercel KV
  const kvConfig = getVercelKVConfig();
  if (kvConfig) {
    const success = await setKVData(data);
    if (success) return true;
  }

  // 2. Lưu xuống file local
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Local DB write failed, updating memory DB:", err);
    // 3. Fallback dùng memory DB
    memoryDb = data;
    return true;
  }
}
