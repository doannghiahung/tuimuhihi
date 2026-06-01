"use client";

import { useState, useEffect, useRef } from "react";

// Meme background images to float around (Bác Gấu & Bùi Xuân Huấn)
const TROLL_MEMES = [
  "/bacgau_1.png",
  "/bacgau_2.png",
  "/bacgau_3.jpg",
  "/bacgau_4.png",
  "/bacgau_5.png",
  "/bag_opened.png" // Bùi Xuân Huấn mới thêm!
];

export default function Home() {
  const [dbState, setDbState] = useState({
    visitorCount: 0,
    participantCount: 0,
    bags: [],
    leaderboard: [],
    currentUser: null
  });
  
  const [loading, setLoading] = useState(true);
  const [uuid, setUuid] = useState("");
  const [activeBag, setActiveBag] = useState(null); // Bag đang chọn để chuẩn bị mở
  
  // State cho Form nhập tên
  const [inputName, setInputName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // State hiển thị túi vừa mở thành công
  const [rewardData, setRewardData] = useState(null);
  
  // Audio và Sound settings (Luôn bật, tự động phát khi click bất kỳ đâu)
  const isMuted = false;
  
  // Ref cho âm thanh
  const bgMusicRef = useRef(null);
  const soundPopRef = useRef(null);
  const soundShakeRef = useRef(null);
  const soundCongratsRef = useRef(null);
  const soundTrollRef = useRef(null);
  
  // Canvas Ref cho Pháo Hoa Confetti
  const canvasRef = useRef(null);
  const confettiIntervalRef = useRef(null);

  // 1. Khởi tạo mã định danh UUID cho thiết bị (Browser UUID)
  useEffect(() => {
    let clientUuid = localStorage.getItem("garena_user_uuid");
    if (!clientUuid) {
      clientUuid = "device_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      localStorage.setItem("garena_user_uuid", clientUuid);
    }
    setUuid(clientUuid);
  }, []);

  // 2. Khởi tạo Audio Objects trên Client-side & Tự động phát nhạc khi click bất kỳ đâu
  useEffect(() => {
    bgMusicRef.current = new Audio("/bg_music.mp3");
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.35;

    soundPopRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
    soundPopRef.current.volume = 0.5;

    soundShakeRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/1103/1103-84.wav");
    soundShakeRef.current.volume = 0.4;

    soundCongratsRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
    soundCongratsRef.current.volume = 0.6;

    soundTrollRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/1803/1803-84.wav");
    soundTrollRef.current.volume = 0.65;

    // Hỗ trợ tự động phát nhạc khi click bất kỳ đâu trên trang
    const startMusic = () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.play().then(() => {
          document.removeEventListener("click", startMusic);
          document.removeEventListener("touchstart", startMusic);
        }).catch(e => {
          console.log("Auto-play blocked by browser. Click to enable sound!", e);
        });
      }
    };
    document.addEventListener("click", startMusic);
    document.addEventListener("touchstart", startMusic);

    return () => {
      if (bgMusicRef.current) bgMusicRef.current.pause();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("touchstart", startMusic);
    };
  }, []);



  // 4. Hàm fetch trạng thái Database từ Server
  const fetchStatus = async (clientUuid) => {
    try {
      const targetUuid = clientUuid || uuid;
      if (!targetUuid) return;
      
      const res = await fetch(`/api/status?uuid=${targetUuid}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setDbState({
          visitorCount: data.visitorCount,
          participantCount: data.participantCount,
          bags: data.bags || [],
          leaderboard: data.leaderboard || [],
          currentUser: data.currentUser || null
        });
        
        // Nếu người dùng đã mở rồi, hãy cho họ xem lại quà đã mở của họ!
        if (data.currentUser && data.currentUser.openedBag) {
          const openedBag = data.currentUser.openedBag;
          if (openedBag.cards) {
            setRewardData({
              bagId: openedBag.id,
              name: data.currentUser.name,
              announcedValue: openedBag.announcedValue,
              cards: openedBag.cards,
              alreadyOpened: true
            });
          }
        }
      }
    } catch (err) {
      console.error("Fetch status failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch khi uuid sẵn sàng
  useEffect(() => {
    if (uuid) {
      fetchStatus(uuid);
    }
  }, [uuid]);

  // 5. Sound Effects trigger
  const playSound = (soundRef) => {
    if (isMuted || !soundRef.current) return;
    soundRef.current.currentTime = 0;
    soundRef.current.play().catch(e => {});
  };


  // 6. Xử lý nhấp chọn Túi Mù
  const handleBagClick = (bag) => {
    playSound(soundPopRef);
    
    // Nếu túi đã bị người khác mở
    if (bag.openedBy) {
      return;
    }
    
    // Nếu thiết bị này đã mở 1 túi rồi, không cho chọn túi mới
    if (dbState.currentUser) {
      alert(`Tham lam thế bạn ơi! Bạn đã mở túi số [Túi ${dbState.currentUser.bagId}] rồi, hãy tận hưởng mã thẻ của bạn nha!`);
      return;
    }
    
    setActiveBag(bag);
    setInputName("");
    setFormError("");
  };

  // 7. Gửi yêu cầu Mở Túi Mù lên Server
  const handleOpenBag = async (e) => {
    e.preventDefault();
    if (!inputName.trim()) {
      setFormError("Vui lòng nhập tên bựa bựa của bạn để mở nhé!");
      return;
    }
    
    setSubmitting(true);
    setFormError("");
    
    try {
      const res = await fetch("/api/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bagId: activeBag.id,
          name: inputName,
          uuid: uuid
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Mở thành công!
        setRewardData({
          bagId: data.bagId,
          name: data.name,
          announcedValue: data.announcedValue,
          cards: data.cards,
          alreadyOpened: false
        });
        
        setActiveBag(null);
        
        // Phát âm thanh chiến thắng
        playSound(soundCongratsRef);

        // Sau đó 2.5 giây phát âm thanh troll bựa
        setTimeout(() => {
          playSound(soundTrollRef);
        }, 2500);

        // Kích hoạt pháo bông ăn mừng
        triggerConfetti();

        // Cập nhật lại danh sách túi mù toàn cục
        fetchStatus(uuid);
      } else {
        setFormError(data.error || "Có lỗi xảy ra, thử lại xem sao!");
      }
    } catch (err) {
      setFormError("Kết nối server thất bại. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Chức năng Sao chép Mã thẻ
  const [copiedStates, setCopiedStates] = useState({});
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    playSound(soundPopRef);
    setCopiedStates({ ...copiedStates, [key]: true });
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [key]: false });
    }, 2000);
  };

  // 9. Hiệu ứng Canvas Pháo Hoa Confetti tự chế cực đẹp
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const colors = ["#ff007f", "#ffee00", "#00f3ff", "#9d00ff", "#39ff14"];
    const particles = [];
    
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }
    
    let active = true;
    
    const draw = () => {
      if (!active) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;
        
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
      
      // Reset hạt nếu bay ra khỏi màn hình
      particles.forEach((p) => {
        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
        }
      });
      
      requestAnimationFrame(draw);
    };
    
    draw();
    
    // Dừng confetti sau 8 giây
    setTimeout(() => {
      active = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 8000);
  };

  // 10. Chức năng Reset Web (Phục vụ Testing nhanh chóng cho người dùng)
  const handleResetApp = async () => {
    if (confirm("🚨 Cảnh báo bựa! Bạn có chắc muốn RESET toàn bộ cơ sở dữ liệu trên web không? Mọi người đã mở sẽ bị xóa hết để bắt đầu khui lại từ đầu!")) {
      setLoading(true);
      try {
        const res = await fetch("/api/reset");
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          setRewardData(null);
          setInputName("");
          setFormError("");
          fetchStatus(uuid);
        }
      } catch (err) {
        alert("Lỗi reset!");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="app-wrapper">
      <canvas ref={canvasRef} className="confetti-canvas"></canvas>
      


      {/* BACKGROUND FLOATING MEMES TROLLING */}
      <div className="bg-memes-container">
        {[...TROLL_MEMES, ...TROLL_MEMES].map((meme, idx) => (
          <img
            key={idx}
            src={meme}
            alt="troll meme bg"
            className="floating-meme"
            style={{
              width: `${110 + (idx % 6) * 35}px`,
              left: `${5 + (idx * 8) % 90}%`,
              animationDelay: `${idx * 2}s`,
              animationDuration: `${10 + (idx % 4) * 4}s`
            }}
          />
        ))}
      </div>

      {/* --- HEADER --- */}
      <header className="header">
        <span className="funny-badge">🎁 Sự Kiện Quốc Tế Thiếu Nhi 1/6 cực bựa 🎉</span>
        <h1 className="bunga-title">MỞ TÚI MÙ HỐT GARENA 500K</h1>
        <p className="header-subtitle">
          Cơ hội vàng duy nhất trong năm! Nhận ngay thẻ cào Garena mệnh giá từ <strong style={{color: "var(--color-yellow)"}}>5.000đ đến 500.000đ</strong> hoàn toàn miễn phí. Đức Anh tài trợ, uy tín 100% không bịp bợm!
        </p>
      </header>

      {/* --- STATS PANEL --- */}
      <section className="stats-container">
        <div className="stat-card">
          <span className="stat-label">Số Lượt Ghé Thăm 👀</span>
          <span className="stat-value">{loading ? "..." : dbState.visitorCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đã Tham Gia Khui 🎁</span>
          <span className="stat-value highlight">{loading ? "..." : dbState.participantCount} / 12 túi</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Nhà Tài Trợ 💎</span>
          <span className="stat-value pink" style={{color: "var(--color-cyan)"}}>Lê Đức Anh</span>
        </div>
      </section>

      {/* --- MAIN GAME: 8 BLIND BAGS GRID --- */}
      <main className="grid-container">
        <h2 className="grid-title">
          🔮 CHỌN TÚI MÙ MAY MẮN CỦA BẠN 🔮
        </h2>
        
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: "var(--color-cyan)", fontWeight: "bold" }}>
            Đang tải dữ liệu túi mù siêu tốc... 🚀
          </div>
        ) : (
          <div className="bags-grid">
            {dbState.bags.map((bag) => {
              const isOpened = !!bag.openedBy;
              return (
                <div
                  key={bag.id}
                  className={`bag-card ${isOpened ? "opened" : "closed"}`}
                  onClick={() => handleBagClick(bag)}
                  onMouseEnter={() => !isOpened && playSound(soundShakeRef)}
                >
                  <span className="bag-number">Túi số {bag.id}</span>
                  
                  {isOpened && <div className="opened-stamp">Đã khui</div>}

                  <div className="bag-image-wrapper">
                    <img
                      src={isOpened ? "/bag_opened.jpg" : "/bag_closed.png"}
                      alt={`Túi mù số ${bag.id}`}
                      width={isOpened ? 115 : 120}
                      height={isOpened ? 115 : 120}
                      className="bag-image"
                    />
                  </div>

                  {isOpened ? (
                    <div className="opened-label-container">
                      <p className="opened-by-text">
                        Opener: <strong className="opened-by-name">{bag.openedBy}</strong>
                      </p>
                      <span className="troll-tag">Trúng {bag.announcedValue}!</span>
                    </div>
                  ) : (
                    <span className="bag-hint">Bấm để Khui!</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- INFO, RULES & LEADERBOARD --- */}
      <section className="info-row">
        {/* Bảng Xếp Hạng */}
        <div className="info-panel">
          <h3 className="panel-title">🏆 BẢNG XẾP HẠNG NGƯỜI MAY MẮN NHẤT</h3>
          <div className="leaderboard-list">
            {dbState.leaderboard.length === 0 ? (
              <p className="empty-leaderboard">Chưa có ai mở túi mù hết. Hãy là người đầu tiên khui túi!</p>
            ) : (
              dbState.leaderboard.map((player, idx) => (
                <div className="leaderboard-item" key={idx}>
                  <div className="leaderboard-rank-name">
                    <span className="rank-badge">{idx + 1}</span>
                    <span className="player-name">{player.name}</span>
                  </div>
                  <div className="lucky-value-tag">
                    {player.announcedValue}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Luật lệ và Hướng dẫn */}
        <div className="info-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="panel-title">📜 THỂ LỆ TÚI MÙ 1/6</h3>
            <div className="rules-list">
              <div className="rule-item">
                <span className="rule-icon">🤪</span>
                <p>Nạp thẻ nhanh chóng tại <a href="https://napthe.vn" target="_blank" rel="noopener noreferrer" style={{color: "var(--color-yellow)", textDecoration: "underline", fontWeight: "bold"}}>napthe.vn</a> để kiểm định độ uy tín của Đức Anh!</p>
              </div>
            </div>
          </div>

          <div className="sponsor-banner">
            <p className="sponsor-title">💰 Quỹ Tài Trợ Đặc Biệt 1/6 💰</p>
            <p className="sponsor-name">Đại gia LÊ ĐỨC ANH</p>
            <p style={{fontSize: "0.8rem", color: "#c9c3e6", marginTop: "5px"}}>Cung cấp 12 chiếc thẻ 5k đầy giá trị & lòng thành!</p>
          </div>
        </div>
      </section>

      {/* --- MODAL 1: NHẬP TÊN ĐỂ MỞ TÚI MÙ --- */}
      {activeBag && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setActiveBag(null)}>✕</button>
            <h3 className="modal-title">🚨 XÁC NHẬN MỞ TÚI {activeBag.id}</h3>
            <p className="modal-desc">
              Nhập cái tên thật bựa của bạn để ghi danh lên trang web. Lưu ý: Mở rồi là không đổi ý được đâu đấy!
            </p>
            
            <form onSubmit={handleOpenBag}>
              <div className="input-wrapper">
                <label className="input-label">Tên của bạn (Viết liền hoặc có dấu):</label>
                <input
                  type="text"
                  maxLength={20}
                  className="text-input"
                  placeholder="Ví dụ: Nguyên Củ Cải, Đức Anh Đại Gia, ..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  disabled={submitting}
                  required
                />
                {formError && <p className="error-message">⚠️ {formError}</p>}
              </div>

              <button
                type="submit"
                className={`btn-primary ${submitting ? "btn-disabled" : ""}`}
                disabled={submitting}
              >
                {submitting ? "Đang Khui Túi..." : "💥 MỞ TÚI ĂN MAY!"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: HIỂN THỊ PHẦN THƯỞNG KHI MỞ THÀNH CÔNG (Troll Celebration) --- */}
      {rewardData && (
        <div className="modal-overlay">
          <div className="modal-content celebration-modal">
            {/* Nếu là túi xem lại, cho phép đóng. Nếu là túi mới mở, cho phép đóng để xem bảng xếp hạng */}
            <button className="modal-close-btn" onClick={() => setRewardData(null)}>✕</button>

            <div className="popup-meme-wrapper" style={{ width: "90px", height: "90px", margin: "0 auto 10px auto", position: "relative" }}>
              <img
                src="/bacgau_5.png"
                alt="Bác Gấu troll"
                width={90}
                height={90}
                className="bag-image"
                style={{ objectFit: "contain" }}
              />
            </div>

            <h3 className="modal-title" style={{color: "var(--color-yellow)"}}>
              {rewardData.alreadyOpened ? "🎁 QUÀ CŨ CỦA BẠN" : "🎉 CHÚC MỪNG CHIẾN THẦN!"}
            </h3>
            
            <p className="congrats-text">
              Bạn ({rewardData.name}) đã khui thành công Túi số {rewardData.bagId}!
            </p>

            <div className="reward-card-container">
              <img
                src="/garena_card.png"
                alt="garena fake card"
                width={260}
                height={160}
                className="reward-card"
              />
              <div className="reward-value-popup">
                TRÚNG {rewardData.announcedValue} GARENA!
              </div>
            </div>

            <div className="troll-explanation">
              🎉 <strong>Cú lừa Thế Kỷ 1/6:</strong> Giao diện báo bạn trúng <strong>{rewardData.announcedValue}</strong>, nhưng Đức Anh chỉ tài trợ thẻ <strong>5.000đ</strong> thôi nhé! Đọc kỹ mã thẻ bên dưới rồi vào nạp nhanh kẻo hết hạn nha bạn hiền! Đức Anh uy tín vcl!
            </div>

            <div className="card-details-box">
              {rewardData.cards.map((card, index) => (
                <div key={index} style={{ borderBottom: index < rewardData.cards.length - 1 ? '1px dashed rgba(255,255,255,0.1)' : 'none', paddingBottom: index < rewardData.cards.length - 1 ? '10px' : '0', marginTop: index > 0 ? '10px' : '0' }}>
                  {rewardData.cards.length > 1 && (
                    <div style={{fontSize: "0.75rem", color: "var(--color-yellow)", fontWeight: "bold", textAlign: "left", marginBottom: "5px"}}>
                      👉 THẺ CÀO SỐ {index + 1}:
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Mã Thẻ (Pin):</span>
                    <div className="detail-value-wrapper">
                      <span className="detail-value">{card.code}</span>
                      <button
                        className={`copy-btn ${copiedStates[`code_${index}`] ? "copied" : ""}`}
                        onClick={() => handleCopy(card.code, `code_${index}`)}
                      >
                        {copiedStates[`code_${index}`] ? "Đã chép" : "Sao chép"}
                      </button>
                    </div>
                  </div>
                  {card.serial && (
                    <div className="detail-row" style={{marginTop: "5px"}}>
                      <span className="detail-label">Số Serial:</span>
                      <div className="detail-value-wrapper">
                        <span className="detail-value" style={{color: "#bbb"}}>{card.serial}</span>
                        <button
                          className={`copy-btn ${copiedStates[`serial_${index}`] ? "copied" : ""}`}
                          onClick={() => handleCopy(card.serial, `serial_${index}`)}
                        >
                          {copiedStates[`serial_${index}`] ? "Đã chép" : "Sao chép"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <a
              href="https://napthe.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: "block", textDecoration: "none", marginBottom: "12px", textAlign: "center", lineHeight: "2" }}
            >
              🚀 ĐI NẠP THẺ TẠI NAPTHE.VN NGAY!
            </a>

            <button className="btn-secondary" onClick={() => setRewardData(null)}>
              🤣 QUAY LẠI CƯỜI TIẾP
            </button>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="footer">
        <p>© 2026. Trang web tạo ra hoàn toàn vì mục đích troll hài hước nhân ngày 1/6.</p>
        <p>
          Cảm ơn nhà tài trợ <strong>Lê Đức Anh</strong> đã mang tiếng cười cho anh em.
        </p>
        <p style={{ marginTop: "12px", fontSize: "0.85rem", color: "#8d85a6", letterSpacing: "0.5px" }}>
          cốt đơ : Hồn Lùng
        </p>
      </footer>
    </div>
  );
}
