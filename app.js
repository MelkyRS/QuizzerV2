// app.js – Quiz biasa + Mode Survival (50 soal, 1 menit per soal)

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // SECTION
  const homeSection = $("home");
  const quizSection = $("quiz");
  const resultSection = $("result");

  // INPUT & BUTTONS
  const categorySelect = $("category");
  const levelSelect = $("level");
  const btnStart = $("btn-start");
  const btnRandom = $("btn-random");
  const btnSurvival = $("btn-survival");

  const metaEl = $("meta");
  const scoreEl = $("score");
  const progressTextEl = $("progressText");
  const pfill = $("pfill");
  const questionTextEl = $("questionText");
  const optionsEl = $("options");
  const explainBox = $("explain");
  const explainTitleEl = $("explainTitle");
  const explainTextEl = $("explainText");
  const timerEl = $("timer");

  const btnNext = $("btn-next");
  const btnRetry = $("btn-retry");
  const btnHome = $("btn-home");
  const btnResRetry = $("btn-res-retry");
  const btnResHome = $("btn-res-home");
  const resultTextEl = $("resultText");

  // STATE
  let questionsData = null;
  let currentQuestions = [];
  let currentIndex = 0;
  let score = 0;
  let mode = "normal"; // "normal" | "survival"
  let lastNormalConfig = { category: null, level: null };

  // SURVIVAL CONFIG
  const SURVIVAL_TOTAL = 50;
  const TIME_PER_QUESTION = 60; // detik
  let timerId = null;
  let timeLeft = 0;
  let questionAnswered = false;

  // UTILS
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showSection(which) {
    homeSection.classList.add("hidden");
    quizSection.classList.add("hidden");
    resultSection.classList.add("hidden");
    if (which === "home") homeSection.classList.remove("hidden");
    if (which === "quiz") quizSection.classList.remove("hidden");
    if (which === "result") resultSection.classList.remove("hidden");
  }

  // TIMER
  function startTimer() {
    stopTimer();
    if (!timerEl) return;
    timeLeft = TIME_PER_QUESTION;
    timerEl.textContent = `Sisa waktu: ${timeLeft} detik`;
    timerId = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        timerEl.textContent = "Waktu habis!";
        stopTimer();
        handleTimeOut();
      } else {
        timerEl.textContent = `Sisa waktu: ${timeLeft} detik`;
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function handleTimeOut() {
    if (questionAnswered) return;
    questionAnswered = true;

    const q = currentQuestions[currentIndex];
    const correctIndex = q.answer;

    const optionButtons = optionsEl.querySelectorAll(".option");
    optionButtons.forEach((btn, idx) => {
      btn.classList.add("disabled");
      btn.style.cursor = "default";
      if (idx === correctIndex) {
        btn.classList.add("correct");
      }
    });

    explainBox.classList.remove("hidden");
    explainTitleEl.textContent = "Waktu habis ⏰";
    explainTextEl.textContent =
      (q.explanation || "Kamu kehabisan waktu untuk soal ini.") +
      " Coba lebih cepat di soal berikutnya.";
  }

  // BANGUN SOAL
  function buildNormalQuestions(category, level) {
    const list =
      questionsData &&
      questionsData[category] &&
      Array.isArray(questionsData[category][level])
        ? questionsData[category][level]
        : [];

    return shuffle(list).map((q) => ({
      ...q,
      _category: category,
      _level: level,
    }));
  }

  function buildSurvivalQuestions() {
    const all = [];
    if (!questionsData) return all;
    for (const cat of Object.keys(questionsData)) {
      const byLevel = questionsData[cat];
      for (const lvl of Object.keys(byLevel)) {
        const arr = Array.isArray(byLevel[lvl]) ? byLevel[lvl] : [];
        arr.forEach((q) => {
          all.push({
            ...q,
            _category: cat,
            _level: lvl,
          });
        });
      }
    }
    const shuffled = shuffle(all);
    if (shuffled.length <= SURVIVAL_TOTAL) return shuffled;
    return shuffled.slice(0, SURVIVAL_TOTAL);
  }

  // MULAI QUIZ
  function startNormalQuiz(randomCategory = false) {
    if (!questionsData) {
      alert("Bank soal belum siap. Pastikan questions.json bisa diakses.");
      return;
    }

    let category = categorySelect.value;
    let level = levelSelect.value;

    if (randomCategory) {
      const cats = Object.keys(questionsData);
      if (!cats.length) {
        alert("Belum ada mata pelajaran di questions.json");
        return;
      }
      category = cats[Math.floor(Math.random() * cats.length)];
      categorySelect.value = category;
    }

    lastNormalConfig = { category, level };
    mode = "normal";
    score = 0;
    currentIndex = 0;
    currentQuestions = buildNormalQuestions(category, level);

    if (!currentQuestions.length) {
      alert("Belum ada soal untuk kombinasi ini.");
      return;
    }

    scoreEl.textContent = score;
    metaEl.textContent = `${category} – Level ${level}`;
    timerEl.textContent = "";
    showSection("quiz");
    renderQuestion();
  }

  function startSurvivalQuiz() {
    if (!questionsData) {
      alert("Bank soal belum siap. Pastikan questions.json bisa diakses.");
      return;
    }
    mode = "survival";
    score = 0;
    currentIndex = 0;
    currentQuestions = buildSurvivalQuestions();

    if (!currentQuestions.length) {
      alert("Belum ada soal di bank soal.");
      return;
    }

    scoreEl.textContent = score;
    metaEl.textContent = "Mode Survival – 50 Soal Campuran";
    showSection("quiz");
    renderQuestion();
  }

  // RENDER SOAL
  function renderQuestion() {
    stopTimer();
    questionAnswered = false;

    if (currentIndex >= currentQuestions.length) {
      return showResult();
    }

    const q = currentQuestions[currentIndex];
    questionTextEl.textContent = q.question || "(Soal tidak tersedia)";
    optionsEl.innerHTML = "";

    (q.options || []).forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = opt;
      btn.dataset.index = idx;
      optionsEl.appendChild(btn);
    });

    const total = currentQuestions.length;
    const done = currentIndex + 1;
    progressTextEl.textContent = `Soal ${done} dari ${total}`;
    pfill.style.width = `${(done - 1) / total * 100}%`;

    if (mode === "normal") {
      metaEl.textContent = `${q._category} – Level ${q._level}`;
      timerEl.textContent = "";
    } else {
      metaEl.textContent = `Survival – Soal ${done} / ${total}`;
      startTimer();
    }

    explainBox.classList.add("hidden");
    explainTitleEl.textContent = "";
    explainTextEl.textContent = "";
  }

  function handleOptionClick(e) {
    const target = e.target;
    if (!target.classList.contains("option")) return;
    if (questionAnswered) return;
    questionAnswered = true;
    stopTimer();

    const q = currentQuestions[currentIndex];
    const correctIndex = q.answer;
    const chosenIndex = parseInt(target.dataset.index, 10);

    const optionButtons = optionsEl.querySelectorAll(".option");
    optionButtons.forEach((btn, idx) => {
      btn.classList.add("disabled");
      btn.style.cursor = "default";
      if (idx === correctIndex) btn.classList.add("correct");
      if (idx === chosenIndex && idx !== correctIndex) btn.classList.add("wrong");
    });

    if (chosenIndex === correctIndex) {
      score++;
      scoreEl.textContent = score;
      explainTitleEl.textContent = "Jawaban kamu BENAR 🎉";
    } else {
      explainTitleEl.textContent = "Jawaban kamu masih salah 😅";
    }

    explainTextEl.textContent =
      q.explanation ||
      "Belum ada penjelasan khusus untuk soal ini. Guru bisa menambahkannya di bank soal.";

    explainBox.classList.remove("hidden");
  }

  function goNext() {
    currentIndex++;
    renderQuestion();
  }

  function showResult() {
    stopTimer();
    const total = currentQuestions.length || 0;
    const percent = total ? Math.round((score / total) * 100) : 0;
    if (mode === "survival") {
      resultTextEl.textContent = `Mode Survival selesai! Kamu menjawab benar ${score} dari ${total} soal (${percent}%).`;
    } else {
      const { category, level } = lastNormalConfig;
      resultTextEl.textContent = `Kuis ${category} – Level ${level} selesai. Skor kamu: ${score} dari ${total} soal (${percent}%).`;
    }
    showSection("result");
  }

  function retry() {
    stopTimer();
    if (mode === "survival") {
      startSurvivalQuiz();
    } else {
      const { category, level } = lastNormalConfig;
      if (!category || !level) {
        showSection("home");
        return;
      }
      startNormalQuiz(false);
    }
  }

  function goHome() {
    stopTimer();
    showSection("home");
  }

  // EVENT
  optionsEl.addEventListener("click", handleOptionClick);
  btnNext.addEventListener("click", goNext);
  btnHome.addEventListener("click", goHome);
  btnResHome.addEventListener("click", goHome);
  btnRetry.addEventListener("click", retry);
  btnResRetry.addEventListener("click", retry);

  btnStart.addEventListener("click", () => startNormalQuiz(false));
  btnRandom.addEventListener("click", () => startNormalQuiz(true));
  btnSurvival.addEventListener("click", startSurvivalQuiz);

  // LOAD questions.json
  async function loadQuestions() {
    try {
      const res = await fetch("questions.json");
      if (!res.ok) throw new Error("Gagal mengambil questions.json");
      const data = await res.json();
      questionsData = data;

      const cats = Object.keys(data || {});
      categorySelect.innerHTML = "";
      cats.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      alert("Gagal memuat questions.json. Pastikan file itu ada dan diakses lewat server (bukan file://).");
    }
  }

  loadQuestions();
});

