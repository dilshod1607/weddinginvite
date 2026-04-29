document.querySelector(".scroll-hint").addEventListener("click", function () {
  const target = document.getElementById("section11");
  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
    });
  }
});

const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  },
  {
    threshold: 0.08,
  },
);
document.querySelectorAll(".fade-in").forEach((el) => obs.observe(el));

const video = document.getElementById("heroVideo");
const canvas = document.getElementById("bokehCanvas");

function spawnOrbs() {
  const colors = [
    "rgba(220,220,220,VAR)",
    "rgba(240,240,240,VAR)",
    "rgba(200,200,200,VAR)",
    "rgba(255,255,255,VAR)",
    "rgba(230,230,230,VAR)",
  ];
  for (let i = 0; i < 18; i++) {
    const orb = document.createElement("div");
    orb.className = "bokeh-orb";
    const size = 60 + Math.random() * 180,
      op = (0.15 + Math.random() * 0.25).toFixed(2);
    const color = colors[Math.floor(Math.random() * colors.length)].replace(
      "VAR",
      op,
    );
    orb.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${10 + Math.random() * 80}%;background:${color};--dur:${7 + Math.random() * 8}s;--delay:${-Math.random() * 10}s;--op:${op};`;
    canvas.appendChild(orb);
  }
}
spawnOrbs();
// Ensure canvas is visible immediately
canvas.style.opacity = "1";

// We don't need these listeners if we want it always visible
// video.addEventListener('error', () => { ... });
// video.addEventListener('playing', () => { ... });

const unlockScreen = document.getElementById("unlock-screen");
const unlockBtn = document.getElementById("unlockBtn");
const musicToggleUnlock = document.getElementById("musicToggleUnlock");
const langBtns = document.querySelectorAll(".lang-btn");

// ========== МУЗЫКАЛЬНЫЙ ПЛЕЕР ==========
(function () {
  let bgMusic = null;
  let isMusicPlaying = false;

  function initAudio() {
    if (bgMusic) return;
    bgMusic = new Audio("./assets/music123.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    bgMusic.preload = "auto";
  }

  // Кнопка музыки на unlock-экране
  const musicToggleUnlock = document.getElementById("musicToggleUnlock");

  // Может быть ещё одна кнопка на основном экране (если есть)
  const musicToggleMain = document.getElementById("musicToggleMain");

  // Функция для обновления иконки кнопки
  function updateMusicIcon(button, isPlaying) {
    if (!button) return;
    const svg = button.querySelector("svg");
    if (!svg) return;

    if (isPlaying) {
      svg.innerHTML = `
                <path d="M3 10v4h4l5 5V5l-5 5H3z"/>
                <path d="M18 8c1.5 1.5 2 3.5 2 6s-0.5 4.5-2 6"/>
                <path d="M21 5c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9"/>
            `;
    } else {
      svg.innerHTML = `
                <path d="M3 10v4h4l5 5V5l-5 5H3z"/>
                <line x1="18" y1="8" x2="22" y2="12"/>
                <line x1="22" y1="8" x2="18" y2="12"/>
            `;
    }
  }

  // Функция для включения музыки
  function playMusic() {
    initAudio();
    bgMusic
      .play()
      .then(() => {
        isMusicPlaying = true;
        updateMusicIcon(musicToggleUnlock, true);
        if (musicToggleMain) updateMusicIcon(musicToggleMain, true);
      })
      .catch((error) => {
        console.log(
          "Автовоспроизведение заблокировано браузером. Нужно взаимодействие пользователя:",
          error,
        );
      });
  }

  // Функция для выключения музыки
  function pauseMusic() {
    if (bgMusic) {
      bgMusic.pause();
      isMusicPlaying = false;
      updateMusicIcon(musicToggleUnlock, false);
      if (musicToggleMain) updateMusicIcon(musicToggleMain, false);
    }
  }

  // Переключение музыки
  function toggleMusic() {
    if (isMusicPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }

  // Вешаем обработчик на кнопку разблокировки
  if (musicToggleUnlock) {
    musicToggleUnlock.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMusic();
    });
  }

  // Если есть кнопка на основном экране
  if (musicToggleMain) {
    musicToggleMain.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMusic();
    });
  }

  const unlockBtnForMusic = document.getElementById("unlockBtn");
  const heroVideo = document.getElementById("heroVideo");

  if (unlockBtnForMusic) {
    unlockBtnForMusic.addEventListener("click", () => {
      // 🎬 VIDEO START
      if (heroVideo) {
        heroVideo.style.opacity = "0";

        heroVideo.load(); // 🔥 MUHIM
        heroVideo.play().catch(() => {}); // 🔥 MUHIM

        heroVideo.onplaying = () => {
          heroVideo.style.transition = "opacity 0.6s ease";
          heroVideo.style.opacity = "1";
        };
      }

      // 🎵 MUSIC
      setTimeout(() => {
        if (!isMusicPlaying) {
          playMusic();
        }
      }, 500);
    });
  }
  // Также пробуем включить при первом любом взаимодействии
  const anyInteraction = () => {
    if (!isMusicPlaying) {
      playMusic();
    }
    document.removeEventListener("click", anyInteraction);
    document.removeEventListener("touchstart", anyInteraction);
  };

  document.addEventListener("click", anyInteraction);
  document.addEventListener("touchstart", anyInteraction);
})();

unlockBtn.addEventListener("click", () => {
  unlockBtn.style.transform = "scale(0.92)";
  setTimeout(() => {
    unlockBtn.style.transform = "";
  }, 120);
  unlockScreen.classList.add("opening");
  unlockScreen.querySelector(".unlock-center").classList.add("unlock-opening");

  setTimeout(() => {
    unlockScreen.classList.add("hidden");
    document.body.classList.remove("overflowH");
    document.body.classList.add("loaded");
    loadGuestsFromDB();
  }, 1200);
});

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С БАЗОЙ ДАННЫХ ==========

async function loadGuestsFromDB() {
  try {
    // Skip fetch if on local server without backend support
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.warn("Local development: skipping guest fetch (no backend)");
      const tbody = document.getElementById("guestsTableBody");
      if (tbody) {
        tbody.innerHTML =
          '<tr class="empty-row"><td colspan="6">Mahalliy serverda mehmonlar ro\'yxati mavjud emas</td></tr>';
        resetStatsToZero();
      }
      return;
    }

    const response = await fetch("get_guests");

    // Check if response is OK and has JSON content type
    const contentType = response.headers.get("content-type");
    if (
      !response.ok ||
      !contentType ||
      !contentType.includes("application/json")
    ) {
      throw new Error("Server returned non-JSON response or error");
    }

    const result = await response.json();

    if (result.success && result.guests) {
      renderGuestsTable(result.guests);
      updateStatsFromGuestsData(result.guests);
    } else {
      console.error("Failed to load guests:", result.error);
      const tbody = document.getElementById("guestsTableBody");
      if (tbody) {
        tbody.innerHTML =
          '<tr class="empty-row"><td colspan="6">Hech qanday mehmon topilmadi</td></tr>';
        resetStatsToZero();
      }
    }
  } catch (error) {
    console.error("Error loading guests:", error);
    const tbody = document.getElementById("guestsTableBody");
    if (tbody) {
      tbody.innerHTML =
        '<tr class="empty-row"><td colspan="6">Ma\'lumotlarni yuklashda xatolik</td></tr>';
      resetStatsToZero();
    }
  }
}

function renderGuestsTable(guests) {
  const tbody = document.getElementById("guestsTableBody");
  if (!tbody) return;

  if (!guests || guests.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="6">Hech qanday mehmon topilmadi</td></tr>';
    return;
  }

  let html = "";

  guests.forEach((guest, index) => {
    let statusClass = "";
    let statusText = "";
    const attendance = guest.attendance || guest.status;
    const guestCount = guest.guestCount ?? guest.guest_count ?? 0;
    const guestTime = guest.timestamp || guest.time || "—";

    switch (attendance) {
      case "yes":
      case "confirmed":
        statusText = "Tasdiqlangan";
        statusClass = "status-confirmed";
        break;
      case "no":
      case "declined":
        statusText = "Kela olmaydi";
        statusClass = "status-declined";
        break;
      default:
        statusText = "Kutilmoqda";
        statusClass = "status-pending";
    }

    const statusBadge = `<span class="status-badge ${statusClass}">${statusText}</span>`;

    html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(guest.name)}</strong></td>
                <td>${guestCount}</td>
                <td>${statusBadge}</td>
                <td>${escapeHtml(guest.comment || "—")}</td>
                <td class="time-cell">${escapeHtml(guestTime)}</td>
            </tr>
        `;
  });

  tbody.innerHTML = html;
}

function updateStatsFromGuestsData(guests) {
  let total = 0;
  let confirmed = 0;
  let declined = 0;

  guests.forEach((guest) => {
    const count = parseInt(guest.guestCount ?? guest.guest_count, 10) || 0;
    const attendance = guest.attendance || guest.status;
    total += count;

    if (attendance === "yes" || attendance === "confirmed") {
      confirmed += count;
    } else if (attendance === "no" || attendance === "declined") {
      declined += count;
    }
  });

  const totalEl = document.getElementById("totalGuests");
  const confirmedEl = document.getElementById("confirmedCount");
  const declinedEl = document.getElementById("declinedCount");

  if (totalEl) totalEl.textContent = total;
  if (confirmedEl) confirmedEl.textContent = confirmed;
  if (declinedEl) declinedEl.textContent = declined;
}

function resetStatsToZero() {
  const totalEl = document.getElementById("totalGuests");
  const confirmedEl = document.getElementById("confirmedCount");
  const declinedEl = document.getElementById("declinedCount");

  if (totalEl) totalEl.textContent = "0";
  if (confirmedEl) confirmedEl.textContent = "0";
  if (declinedEl) declinedEl.textContent = "0";
}

function escapeHtml(str) {
  if (!str) return "—";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ========== GUEST SELECTOR ==========
(function () {
  const guestCountSpan = document.querySelector(".guest-count");
  const minusBtn = document.querySelector(".guest-minus");
  const plusBtn = document.querySelector(".guest-plus");
  let count = 1;
  const max = 5;
  const min = 1;

  if (minusBtn && plusBtn && guestCountSpan) {
    minusBtn.addEventListener("click", () => {
      if (count > min) {
        count--;
        guestCountSpan.textContent = count;
      }
    });

    plusBtn.addEventListener("click", () => {
      if (count < max) {
        count++;
        guestCountSpan.textContent = count;
      }
    });
  }
})();

// ========== TIMER ==========
function updateLuxuryTimer() {
  const targetDate = new Date(2026, 5, 21, 19, 0, 0);
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    document.getElementById("days").innerHTML = "0";
    document.getElementById("hours").innerHTML = "00";
    document.getElementById("minutes").innerHTML = "00";
    document.getElementById("seconds").innerHTML = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  document.getElementById("days").innerHTML = days;
  document.getElementById("hours").innerHTML = hours < 10 ? "0" + hours : hours;
  document.getElementById("minutes").innerHTML =
    minutes < 10 ? "0" + minutes : minutes;
  document.getElementById("seconds").innerHTML =
    seconds < 10 ? "0" + seconds : seconds;
}

updateLuxuryTimer();
setInterval(updateLuxuryTimer, 1000);

// ========== SHARE FUNCTIONALITY ==========
(function () {
  const currentUrl = window.location.href;

  const telegramBtn = document.getElementById("telegramShare");
  if (telegramBtn) {
    telegramBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}`;
      window.open(telegramUrl, "_blank", "noopener,noreferrer");
    });
  }

  const whatsappBtn = document.getElementById("whatsappShare");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(currentUrl)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    });
  }

  const copyBtn = document.getElementById("copyLinkBtn");
  const copyNote = document.getElementById("copyNote");

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(currentUrl);
        copyNote.classList.add("show");
        setTimeout(() => {
          copyNote.classList.remove("show");
        }, 2500);
      } catch (err) {
        console.error("Nusxa olishda xatolik:", err);
        const textarea = document.createElement("textarea");
        textarea.value = currentUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copyNote.classList.add("show");
        setTimeout(() => {
          copyNote.classList.remove("show");
        }, 2500);
      }
    });
  }
})();

// ========== LANGUAGE TRANSLATIONS ==========
langBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    langBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const lang = btn.getAttribute("data-lang");

    const translations = {
      ru: {
        title: "ВЫ ПОЛУЧИЛИ ПРИГЛАШЕНИЕ",
        instruction: "Нажмите на замок,",
        instruction1: "чтобы открыть приглашение",
        heros1: "Приглашение на свадьбу",
        heros2: "21 июня 2026 | 19:00",
        herodate: "Ваше присутствие — самый дорогой подарок для нас",
        timerlabel: "ВРЕМЯ ДО СВАДЬБЫ",
        unit11: "дней",
        unit22: "часов",
        unit33: "минут",
        unit44: "секунд",
        scroll11: "листайте вниз",
        tag11: "Дорогие гости!",
        quote11:
          "Мы хотим отпраздновать этот дорогой для нас день вместе с вами. Будем искренне рады, если вы разделите с нами нашу радость.",
        cal11: "СЧИТАННЫЕ ДНИ",
        cal22: "Свадебный календарь",
        cal33: "ИЮНЬ 2026",
        cale1: "Пн",
        cale2: "Вт",
        cale3: "Ср",
        cale4: "Чт",
        cale5: "Пт",
        cale6: "Сб",
        cale7: "Вс",
        notetext1: "сердце — день свадьбы",
        detcd1: "Кратко о нашей свадьбе",
        detcd2: "Детали мероприятия",
        detcd3: "Место проведения",
        detcd4: "Ресторан «MOHINUR-3», Самарканд, Пайарык",
        detcd5: "Открыть на карте →",
        detcd6: "Время",
        detcd7: "21 июня 2026 года, 19:00",
        detcd8: "Двери открыты с 18:30",
        detcd14:
          "Ваша улыбка — наше главное украшение. Заранее благодарим за вклад в создание атмосферы уважения и тепла.",
        locat1: "РАСПОЛОЖЕНИЕ И МАРШРУТ",
        locat2: "Найдите нас",
        locat3: "Ресторан «MOHINUR-3»",
        locat4: "Самарканд, Пайарык",
        locat5: "Создать маршрут",
        guest11: "от 1 до 5",
        gift11: "Подарки",
        gift22: "Просьбы к гостям",
        gift33:
          "Для нас самое главное — ваше присутствие рядом с нами в этот свадебный вечер. Мы искренне ценим ваше внимание и участие!",
        gift44:
          "Если вы хотите порадовать нас ещё больше, будем очень признательны, если вы выразите своё внимание к нашей молодой семье в виде конверта.",
        clos11: "Добро пожаловать на свадьбу!",
        clos22: "Выражаем искреннюю благодарность за то,",
        clos33: "что вы с нами в этот счастливый день.",
        clos44: "С уважением,",
        share11: "ПОДЕЛИТЕСЬ ПРИГЛАШЕНИЕМ",
        share22: "Расскажите своим друзьям",
        share33:
          "Поделитесь приглашением с близкими — они тоже приглашены на наш праздник!",
        share44: "Копировать",
        share55: "Ссылка скопирована!",
        date11: "21 июня 2026 | 19:00",
        date22: "Спасибо за то, что были с нами в этот самый прекрасный день!",
      },
      uz: {
        title: "SIZGA TAKLIFNOMA KELDI",
        instruction: "Qulfchani bosib,",
        instruction1: "taklifnomani oching",
        heros1: "To‘yga taklifnoma",
        heros2: "21-iyun 2026 | 19:00",
        herodate: "Sizning ishtirokingiz — biz uchun eng qadrli sovg‘a",
        timerlabel: "TO‘YGACHA QOLGAN VAQT",
        unit11: "kun",
        unit22: "soat",
        unit33: "daqiqa",
        unit44: "soniya",
        scroll11: "Pastga aylantirin",
        tag11: "Hurmatli mehmonlar",
        quote11:
          "Biz uchun aziz bo‘lgan ushbu kunni siz bilan birga nishonlashni istaymiz. Quvonchimizga sherik bo‘lishingizdan mamnun bo‘lamiz.",
        cal11: "SANALGAN KUNLAR",
        cal22: "To‘y kalendari",
        cal33: "IYUN 2026",
        cale1: "Du",
        cale2: "Se",
        cale3: "Ch",
        cale4: "Pa",
        cale5: "Ju",
        cale6: "Sh",
        cale7: "Ya",
        notetext1: "yurak — to‘y kuni",
        detcd1: "To‘yimiz haqida qisqacha",
        detcd2: "Tadbir tafsilotlari",
        detcd3: "Manzil",
        detcd4: "“MOHINUR-3” restorani, Payariq, Samarqand",
        detcd5: "Xaritada ochish →",
        detcd6: "Vaqt",
        detcd7: "2026-yil 21-iyun, soat 19:00",
        detcd8: "Eshiklar 18:30 dan ochiq",
        detcd14:
          "Sizning tabassumingiz — bizning eng katta bezakimiz. Hurmat va mehr muhitini yaratishga qo‘shilgan hissangiz uchun oldindan rahmat.",
        locat1: "JOYLASHUV VA YO‘NALISH",
        locat2: "Bizni toping",
        locat3: "“MOHINUR-3” restorani",
        locat4: "Payariq, Samarqand",
        locat5: "Marshrut yaratish",
        guest11: "1 dan 5 gacha",
        gift11: "Sovg‘alar",
        gift22: "Mehmonlarga iltimoslar",
        gift33:
          "Biz uchun eng muhimi — sizning to‘y oqshomida yonimizda bo‘lishingiz. E’tiboringiz va ishtirokingizni chin qalbdan qadrlaymiz!",
        gift44:
          "Agar bizni yanada xursand qilmoqchi bo‘lsangiz, yosh oilamizga ko‘rsatgan e’tiboringizni konvert shaklida bildirsangiz, bundan benihoya mamnun bo‘lamiz.",
        clos11: "To‘yga xush kelibsiz!",
        clos22: "Bu baxtli kunda biz bilan birga bo‘lganingiz uchun",
        clos33: "samimiy minnatdorchilik bildiramiz.",
        clos44: "Hurmat bilan,",
        share11: "TAKLIFNOMANI ULASHING",
        share22: "Do‘stlaringizga yetkazing",
        share33:
          "Taklifnomani yaqinlaringizga ham ulashing — ular ham bizning bayramimizga taklif qilingan!",
        share44: "Nusxa olish",
        share55: "Havola nusxalandi!",
        date11: "21-iyun 2026 | 19:00",
        date22:
          "Eng go‘zal kunda biz bilan birga bo‘lganingiz uchun tashakkur!",
      },
      uzk: {
        title: "СИЗГА ТАКЛИФНОМА КЕЛДИ",
        instruction: "Қулфчани босиб,",
        instruction1: "таклифномани очинг",
        heros1: "Тўйга таклифнома",
        heros2: "21 июнь 2026 | 19:00",
        herodate: "Сизнинг иштирокингиз — биз учун энг қадрли совға",
        timerlabel: "ТЎЙГАЧА ҚОЛГАН ВАҚТ",
        unit11: "кун",
        unit22: "соат",
        unit33: "дақиқа",
        unit44: "сония",
        scroll11: "пастга айлантиринг",
        tag11: "Ҳурматли меҳмонлар!",
        quote11:
          "Биз учун азиз бўлган ушбу кунни сиз билан бирга нишонлашни истаймиз. Қувончимизга шерик бўлишингиздан мамнун бўламиз.",
        cal11: "САНОҚЛИ КУНЛАР",
        cal22: "Тўй календари",
        cal33: "ИЮНЬ 2026",
        cale1: "Ду",
        cale2: "Се",
        cale3: "Чо",
        cale4: "Па",
        cale5: "Жу",
        cale6: "Ша",
        cale7: "Як",
        notetext1: "юрак — тўй куни",
        detcd1: "Тўйимиз ҳақида қисқача",
        detcd2: "Тадбир тафсилотлари",
        detcd3: "Манзил",
        detcd4: "«MOHINUR-3» ресторани, Самарқанд, Пайариқ",
        detcd5: "Харитада очиш →",
        detcd6: "Вақт",
        detcd7: "2026-йил 21-июнь, соат 19:00",
        detcd8: "Эшиклар 18:30 дан очиқ",
        detcd14:
          "Сизнинг табассумингиз — бизнинг энг катта безагимиз. Ҳурмат ва меҳр муҳитини яратишга қўшган ҳиссангиз учун олдиндан раҳмат.",
        locat1: "ЖОЙЛАШУВ ВА ЙЎНАЛИШ",
        locat2: "Бизни топинг",
        locat3: "«MOHINUR-3» ресторани",
        locat4: "Самарқанд, Пайариқ",
        locat5: "Маршрут яратиш",
        guest11: "1 дан 5 гача",
        gift11: "Совғалар",
        gift22: "Меҳмонларга илтимослар",
        gift33:
          "Биз учун энг муҳими — сизнинг тўй оқшомида ёнимизда бўлишингиз. Эътиборингиз ва иштирокингизни чин қалбдан қадрлаймиз!",
        gift44:
          "Агар бизни янада хурсанд қилмоқчи бўлсангиз, ёш оиламизга кўрсатган эътиборингизни конверт шаклида билдирсангиз, бундан беҳад мамнун бўламиз.",
        clos11: "Тўйга хуш келибсиз!",
        clos22: "Бу бахтли кунда биз билан бирга бўлганингиз учун",
        clos33: "самимий миннатдорчилик билдирамиз.",
        clos44: "Ҳурмат билан,",
        share11: "ТАКЛИФНОМАНИ УЛАШИНГ",
        share22: "Дўстларингизга етказинг",
        share33:
          "Таклифномани яқинларингизга ҳам улашинг — улар ҳам бизнинг байрамимизга таклиф қилинган!",
        share44: "Нусха олиш",
        share55: "Ҳавола нусхаланди!",
        date11: "21 июнь 2026 | 19:00",
        date22: "Энг гўзал кунда биз билан бирга бўлганингиз учун ташаккур!",
      },
      en: {
        title: "YOU HAVE RECEIVED AN INVITATION",
        instruction: "Click the lock",
        instruction1: "to open the invitation",
        heros1: "Wedding Invitation",
        heros2: "June 21, 2026 | 19:00",
        herodate: "Your presence is the most precious gift to us",
        timerlabel: "TIME REMAINING UNTIL THE WEDDING",
        unit11: "days",
        unit22: "hours",
        unit33: "minutes",
        unit44: "seconds",
        scroll11: "scroll down",
        tag11: "Dear Guests",
        quote11:
          "We wish to celebrate this day, which is so dear to us, together with you. We would be delighted to have you share in our joy.",
        cal11: "COUNTING DAYS",
        cal22: "Wedding Calendar",
        cal33: "JUNE 2026",
        cale1: "Mon",
        cale2: "Tue",
        cale3: "Wed",
        cale4: "Thu",
        cale5: "Fri",
        cale6: "Sat",
        cale7: "Sun",
        notetext1: "heart — wedding day",
        detcd1: "About Our Wedding",
        detcd2: "Event Details",
        detcd3: "Location",
        detcd4: "“MOHINUR-3” Restaurant, Payariq, Samarkand",
        detcd5: "Open on map →",
        detcd6: "Time",
        detcd7: "June 21, 2026, 19:00",
        detcd8: "Doors open from 18:30",
        detcd14:
          "Your smile is our greatest decoration. Thank you in advance for your contribution to creating an atmosphere of respect and warmth.",
        locat1: "LOCATION AND ROUTE",
        locat2: "Find us",
        locat3: "“MOHINUR-3” restaurant",
        locat4: "Payariq, Samarkand",
        locat5: "Get directions",
        guest11: "from 1 to 5",
        gift11: "Gifts",
        gift22: "Requests to Guests",
        gift33:
          "The most important thing for us is your presence by our side on this special wedding evening. We truly appreciate your attention and participation!",
        gift44:
          "If you would like to make us even happier, we would be sincerely grateful if you present your gift to our young family in the form of an envelope.",
        clos11: "Welcome to the wedding!",
        clos22: "We express our sincere gratitude for",
        clos33: "being with us on this happy day.",
        clos44: "Sincerely,",
        share11: "SHARE THE INVITATION",
        share22: "Tell your friends",
        share33:
          "Share the invitation with your loved ones — they are also invited to our celebration!",
        share44: "Copy",
        share55: "Link copied!",
        date11: "June 21, 2026 | 19:00",
        date22: "Thank you for being with us on this most beautiful day!",
      },
    };

    if (translations[lang]) {
      const t = translations[lang];
      document.querySelector(".unlock-title").textContent = t.title;
      document.querySelector(".unlock-instruction").textContent = t.instruction;
      document.querySelector(".unlock1-instruction1").textContent =
        t.instruction1;
      document.querySelector(".heros1").textContent = t.heros1;
      document.querySelector(".heros2").textContent = t.heros2;
      document.querySelector(".hero-date").textContent = t.herodate;
      document.querySelector(".timer-label").textContent = t.timerlabel;
      document.querySelector(".unit11").textContent = t.unit11;
      document.querySelector(".unit22").textContent = t.unit22;
      document.querySelector(".unit33").textContent = t.unit33;
      document.querySelector(".unit44").textContent = t.unit44;
      document.querySelector(".scroll11").textContent = t.scroll11;
      document.querySelector(".tag11").textContent = t.tag11;
      document.querySelector(".quote11").textContent = t.quote11;
      document.querySelector(".cal11").textContent = t.cal11;
      document.querySelector(".cal22").textContent = t.cal22;
      document.querySelector(".cal33").textContent = t.cal33;
      document.querySelector(".cale1").textContent = t.cale1;
      document.querySelector(".cale2").textContent = t.cale2;
      document.querySelector(".cale3").textContent = t.cale3;
      document.querySelector(".cale4").textContent = t.cale4;
      document.querySelector(".cale5").textContent = t.cale5;
      document.querySelector(".cale6").textContent = t.cale6;
      document.querySelector(".cale7").textContent = t.cale7;
      document.querySelector(".notetext1").textContent = t.notetext1;
      document.querySelector(".detcd1").textContent = t.detcd1;
      document.querySelector(".detcd2").textContent = t.detcd2;
      document.querySelector(".detcd3").textContent = t.detcd3;
      document.querySelector(".detcd4").textContent = t.detcd4;
      document.querySelector(".detcd5").textContent = t.detcd5;
      document.querySelector(".detcd6").textContent = t.detcd6;
      document.querySelector(".detcd7").textContent = t.detcd7;
      document.querySelector(".detcd8").textContent = t.detcd8;
      document.querySelector(".detcd14").textContent = t.detcd14;
      document.querySelector(".locat1").textContent = t.locat1;
      document.querySelector(".locat2").textContent = t.locat2;
      document.querySelector(".locat3").textContent = t.locat3;
      document.querySelector(".locat4").textContent = t.locat4;
      document.querySelector(".locat5").textContent = t.locat5;
      document.querySelector(".guest11").textContent = t.guest11;
      document.querySelector(".gift11").textContent = t.gift11;
      document.querySelector(".gift22").textContent = t.gift22;
      document.querySelector(".gift33").textContent = t.gift33;
      document.querySelector(".gift44").textContent = t.gift44;
      document.querySelector(".clos11").textContent = t.clos11;
      document.querySelector(".clos22").textContent = t.clos22;
      document.querySelector(".clos33").textContent = t.clos33;
      document.querySelector(".clos44").textContent = t.clos44;
      document.querySelector(".share11").textContent = t.share11;
      document.querySelector(".share22").textContent = t.share22;
      document.querySelector(".share33").textContent = t.share33;
      document.querySelector(".share44").textContent = t.share44;
      document.querySelector(".share55").textContent = t.share55;
      document.querySelector(".date11").textContent = t.date11;
      document.querySelector(".date22").textContent = t.date22;
    }
    translateRsvpSection(lang);
  });
});

document.querySelector('.lang-btn[data-lang="uz"]').classList.add("active");

function translateRsvpSection(lang) {
  const translations = {
    ru: {
      tag: "ПОДТВЕРДИТЕ СВОЕ ПРИСУТСТВИЕ",
      title: "Будьте с нами",
      nameLabel: "Имя гостя",
      namePlaceholder: "Введите ваше имя",
      guestsLabel: "Количество гостей",
      attendanceLabel: "Вы придете на свадьбу?",
      attendanceYes: "Да, с удовольствием",
      attendanceNo: "К сожалению, не смогу прийти",
      commentLabel: "Комментарий (необязательно)",
      commentPlaceholder: "Ваши пожелания или вопросы",
      submitBtn: "Отправить",
      noteText: "Обязательные поля",
      toastMessage: "Спасибо! Ваш ответ успешно сохранен",
    },
    uz: {
      tag: "ISHTIROKINGIZNI TASDIQLANG",
      title: "Biz bilan bo‘ling",
      nameLabel: "Mehmon ismi",
      namePlaceholder: "Ismingizni kiriting",
      guestsLabel: "Mehmonlar soni",
      attendanceLabel: "To'yga kelasizmi?",
      attendanceYes: "Ha, mamnuniyat bilan",
      attendanceNo: "Afsuski, kela olmayman",
      commentLabel: "Sharh (ixtiyoriy)",
      commentPlaceholder: "Sizning tilaklaringiz yoki savollaringiz",
      submitBtn: "Yuborish",
      noteText: "Majburiy maydonlar",
      toastMessage: "Rahmat! Javobingiz muvaffaqiyatli saqlandi",
    },
    uzk: {
      tag: "ИШТИРОКИНГИЗНИ ТАСДИҚЛАНГ",
      title: "Биз билан бўлинг",
      nameLabel: "Меҳмон исми",
      namePlaceholder: "Исмингизни киритинг",
      guestsLabel: "Меҳмонлар сони",
      attendanceLabel: "Тўйга келасизми?",
      attendanceYes: "Ҳа, мамнуният билан",
      attendanceNo: "Афсуски, кела олмайман",
      commentLabel: "Шарҳ (ихтиёрий)",
      commentPlaceholder: "Сизнинг тилакларингиз ёки саволларингиз",
      submitBtn: "Юбориш",
      noteText: "Мажбурий майдонлар",
      toastMessage: "Раҳмат! Жавобингиз муваффақиятли сақланди",
    },
    en: {
      tag: "CONFIRM YOUR ATTENDANCE",
      title: "Be with us",
      nameLabel: "Guest name",
      namePlaceholder: "Enter your name",
      guestsLabel: "Number of guests",
      attendanceLabel: "Will you attend the wedding?",
      attendanceYes: "Yes, with pleasure",
      attendanceNo: "Unfortunately, I cannot come",
      commentLabel: "Comment (optional)",
      commentPlaceholder: "Your wishes or questions",
      submitBtn: "Submit",
      noteText: "Required fields",
      toastMessage: "Thank you! Your response has been successfully saved",
    },
  };

  const t = translations[lang] || translations.uz;
  const rsvpSection = document.querySelector(".rsvp-section");
  if (!rsvpSection) return;

  const tag = rsvpSection.querySelector(".tag");
  if (tag) tag.textContent = t.tag;

  const title = rsvpSection.querySelector(".sec-title");
  if (title) title.innerHTML = t.title;

  const formLabels = rsvpSection.querySelectorAll(".form-label .label-text");
  if (formLabels[0]) formLabels[0].textContent = t.nameLabel;
  if (formLabels[1]) formLabels[1].textContent = t.guestsLabel;
  if (formLabels[2]) formLabels[2].textContent = t.attendanceLabel;
  if (formLabels[3]) formLabels[3].textContent = t.commentLabel;

  const nameInput = rsvpSection.querySelector(".form-input");
  if (nameInput) nameInput.placeholder = t.namePlaceholder;

  const textarea = rsvpSection.querySelector(".form-textarea");
  if (textarea) textarea.placeholder = t.commentPlaceholder;

  const radioTexts = rsvpSection.querySelectorAll(".radio-text");
  if (radioTexts[0]) radioTexts[0].textContent = t.attendanceYes;
  if (radioTexts[1]) radioTexts[1].textContent = t.attendanceNo;

  const submitBtn = rsvpSection.querySelector(".submit-btn .btn-text");
  if (submitBtn) submitBtn.textContent = t.submitBtn;

  const noteText = rsvpSection.querySelector(".form-note .note-text");
  if (noteText) noteText.textContent = t.noteText;

  const toastSpan = document.querySelector("#toastMessage span");
  if (toastSpan) toastSpan.textContent = t.toastMessage;
}

// ========== AJAX FORM SUBMISSION ==========
(function () {
  const form = document.getElementById("rsvpForm");
  const toast = document.getElementById("toastMessage");

  function getFormData() {
    const nameInput = form.querySelector(".form-input");
    const guestCountSpan = document.querySelector(".guest-count");
    const attendanceRadio = form.querySelector(
      'input[name="attendance"]:checked',
    );
    const textarea = form.querySelector(".form-textarea");
    const honeypot = form.querySelector('input[name="website"]');

    return {
      name: nameInput ? nameInput.value.trim() : "",
      guestCount: guestCountSpan ? parseInt(guestCountSpan.textContent) : 1,
      attendance: attendanceRadio ? attendanceRadio.value : "yes",
      comment: textarea ? textarea.value.trim() : "",
      timestamp: new Date().toLocaleString("uz-UZ"),
      isBot: honeypot ? honeypot.value !== "" : false,
    };
  }

  function resetForm() {
    const nameInput = form.querySelector(".form-input");
    const guestCountSpan = document.querySelector(".guest-count");
    const textarea = form.querySelector(".form-textarea");
    const yesRadio = form.querySelector('input[value="yes"]');

    if (nameInput) nameInput.value = "";
    if (guestCountSpan) guestCountSpan.textContent = "1";
    if (textarea) textarea.value = "";
    if (yesRadio) yesRadio.checked = true;

    const minusBtn = document.querySelector(".guest-minus");
    const plusBtn = document.querySelector(".guest-plus");
    if (window.guestCounter) window.guestCounter = 1;
  }

  function showToast(message) {
    if (!toast) return;

    const toastSpan = toast.querySelector("span");
    if (toastSpan && message) {
      toastSpan.textContent = message;
    }

    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  function validateForm(data) {
    if (!data.name) {
      const nameInput = form.querySelector(".form-input");
      if (nameInput) {
        nameInput.style.borderColor = "#363636";
        nameInput.focus();
      }
      return false;
    }
    return true;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = getFormData();

      if (!validateForm(formData)) {
        return;
      }

      const submitBtn = form.querySelector(".submit-btn");
      const originalBtnText =
        submitBtn?.querySelector(".btn-text")?.textContent || "Yuborish";

      if (submitBtn) {
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector(".btn-text");
        if (btnText) btnText.textContent = "Yuborilmoqda...";
      }

      try {
        const response = await fetch("save_rsvp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        // Check if response is OK and has JSON content type
        const contentType = response.headers.get("content-type");
        if (
          !response.ok ||
          !contentType ||
          !contentType.includes("application/json")
        ) {
          throw new Error("Server returned non-JSON response or error");
        }

        const result = await response.json();

        if (result.success) {
          await loadGuestsFromDB();
          resetForm();
          showToast();
        } else {
          console.error("Server error:", result.error);
          showToast("Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.");
        }
      } catch (error) {
        console.error("Network error:", error);
        showToast("Tarmoq xatosi. Iltimos, internet aloqangizni tekshiring.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          const btnText = submitBtn.querySelector(".btn-text");
          if (btnText) btnText.textContent = originalBtnText;
        }
      }
    });
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  // Track unique visit
  fetch("track_visit", { method: "POST" }).catch(() => {});

  // Existing code...
  const footerTrigger = document.querySelector(".footer-names");
  const guestSection = document.getElementById("guests123");

  let clickCount = 0;
  let lastClickTime = 0;

  const PASSWORD = "1234"; // ← задай свой пароль

  if (footerTrigger && guestSection) {
    footerTrigger.addEventListener("click", () => {
      const currentTime = new Date().getTime();

      if (currentTime - lastClickTime > 1500) {
        clickCount = 0;
      }

      clickCount++;
      lastClickTime = currentTime;

      if (clickCount === 3) {
        const userPassword = prompt("Parolni kiriting:");

        if (userPassword === PASSWORD) {
          // переключение видимости
          if (guestSection.style.display === "block") {
            guestSection.style.display = "none";
          } else {
            guestSection.style.display = "block";
          }
        } else {
          alert("Parol noto‘g‘ri ❌");
        }

        clickCount = 0;
      }
    });
  }
});
