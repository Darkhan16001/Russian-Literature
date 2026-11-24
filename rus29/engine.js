"use strict";

// ОБЩИЙ ДВИЖОК RUS24–RUS32
// BY DARKHAN

const $ = id => document.getElementById(id);
const C = window.LESSON;

if (!C) {
    throw new Error("Проверьте файл script.js");
}

const blue = t => `<b class="blue">${t}</b>`;
const red = t => `<b class="red">${t}</b>`;
const green = t => `<b class="green">${t}</b>`;

const storageKey = C.id + "-settings";

function load(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function save(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {}
}

function normalizeCount(n) {
    return Math.max(0, Math.min(25, Math.floor(Number(n) || 0)));
}

const saved = load(storageKey, {}) || {};

let count = normalizeCount(saved.count ?? 24);
let mode = saved.mode === "individual" ? "individual" : "auto";

let zoom = Number(load(C.id + "-zoom", 100));

if (!Number.isFinite(zoom)) zoom = 100;

document.title = C.title;

document.documentElement.style.setProperty("--dark", C.colors[0]);
document.documentElement.style.setProperty("--accent", C.colors[1]);

$("sectionName").textContent = C.section;

// ==========================================
// УЧЕБНЫЕ БЛОКИ
// ==========================================

function rule(title, text) {
    return `<div class="rule">${blue(title)}<p>${text}</p></div>`;
}

function important(title, text) {
    return `<div class="important">${red(title)}<p>${text}</p></div>`;
}

function conclusion(text) {
    return `<div class="conclusion">${green("Вывод")}<p>${text}</p></div>`;
}

function table(headers, rows) {
    return `
    <div class="table-wrap">
        <table>
            <thead>
                <tr>${headers.map(x => `<th>${x}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${rows.map(row => `
                    <tr>${row.map(x => `<td>${x}</td>`).join("")}</tr>
                `).join("")}
            </tbody>
        </table>
    </div>`;
}

function answer(text) {
    return `
    <details class="answer">
        <summary>Показать ответ</summary>
        <div class="answer-text">${green("Ответ:")}<p>${text}</p></div>
    </details>`;
}

function questions(items) {
    return items.map((item, i) => `
        <div class="question">
            <div class="question-title">
                ${blue((i + 1) + ".")} ${item[0]}
            </div>
            ${answer(item[1])}
        </div>
    `).join("");
}

function showAnswers(value) {
    $("page").querySelectorAll(".answer").forEach(d => {
        d.open = value;
    });
}

document.addEventListener("toggle", event => {
    if (!event.target.matches?.(".answer")) return;

    event.target.querySelector("summary").textContent =
        event.target.open ? "Скрыть ответ" : "Показать ответ";
}, true);

// ==========================================
// ВСТРОЕННЫЕ ИЛЛЮСТРАЦИИ
// ==========================================

const art = {

    book: `
        <rect width="800" height="500" fill="#d9c7a9"/>
        <rect x="95" y="65" width="610" height="380" rx="15" fill="#52677b"/>
        <path d="M115 90 Q260 45 400 115 Q540 45 685 90
                 V415 Q540 370 400 440 Q260 370 115 415 Z"
              fill="#fff5dc" stroke="#ae9875" stroke-width="5"/>
        <path d="M400 115 V440" stroke="#ae9875" stroke-width="4"/>
        ${Array.from({length:9},(_,i)=>`
            <path d="M150 ${135+i*29} L365 ${155+i*29}
                     M435 ${155+i*29} L650 ${135+i*29}"
                  stroke="#bdac90" stroke-width="4"/>
        `).join("")}
    `,

    letter: `
        <rect width="800" height="500" fill="#c9b697"/>
        <rect x="150" y="45" width="500" height="405"
              rx="8" fill="#fff5df" stroke="#a38c68" stroke-width="4"/>
        ${Array.from({length:10},(_,i)=>`
            <path d="M195 ${95+i*30} Q390 ${85+i*30} 600 ${95+i*30}"
                  fill="none" stroke="#938879" stroke-width="3"/>
        `).join("")}
        <path d="M490 410 L720 200" stroke="#6f4d35"
              stroke-width="14" stroke-linecap="round"/>
    `,

    steppe: `
        <rect width="800" height="500" fill="#cde7f3"/>
        <circle cx="650" cy="95" r="65" fill="#f4d17e"/>
        <path d="M0 285 L150 135 L280 280 L430 95
                 L600 280 L720 180 L800 285 V500 H0 Z"
              fill="#9cb2bc"/>
        <path d="M0 340 Q200 235 400 340 T800 315 V500 H0 Z"
              fill="#b7bd80"/>
        <path d="M0 410 Q200 310 400 410 T800 385 V500 H0 Z"
              fill="#8fa36b"/>
        <path d="M370 340 Q540 390 420 440
                 Q365 470 570 500 H700
                 Q500 455 550 410 Q590 370 420 340 Z"
              fill="#dfc69d"/>
    `,

    garden: `
        <rect width="800" height="500" fill="#dcecf2"/>
        <rect y="365" width="800" height="135" fill="#a5b97d"/>
        ${[125,305,495,675].map((x,i)=>`
            <rect x="${x-12}" y="180" width="24" height="250"
                  fill="#82634d"/>
            <circle cx="${x}" cy="${155+i%2*25}" r="102" fill="#789c75"/>
            ${Array.from({length:12},(_,j)=>`
                <circle cx="${x+65*Math.cos(j*2.4)}"
                        cy="${160+65*Math.sin(j*2.4)}"
                        r="12" fill="#fff8f4"/>
            `).join("")}
        `).join("")}
        <path d="M330 500 L395 365 H435 L570 500 Z" fill="#dfc69d"/>
    `,

    house: `
        <rect width="800" height="500" fill="#cfe5ee"/>
        <rect y="365" width="800" height="135" fill="#9db77a"/>
        <rect x="210" y="205" width="380" height="220"
              fill="#eadcc2"/>
        <path d="M170 215 L400 75 L630 215 Z" fill="#86614f"/>
        <rect x="360" y="305" width="80" height="120" fill="#80654d"/>
        ${[255,490].map(x=>`
            <rect x="${x}" y="260" width="55" height="70"
                  fill="#a4cad9" stroke="#fff4df" stroke-width="8"/>
        `).join("")}
        <path d="M360 425 H440 L570 500 H230 Z" fill="#dfc69d"/>
    `,

    road: `
        <rect width="800" height="500" fill="#d3e5ec"/>
        <circle cx="170" cy="105" r="60" fill="#efd394"/>
        <path d="M0 310 Q200 155 400 310 T800 285 V500 H0 Z"
              fill="#a7b987"/>
        <path d="M0 390 Q200 290 400 390 T800 360 V500 H0 Z"
              fill="#829b68"/>
        <path d="M380 300 Q500 340 400 405 Q330 455 560 500
                 H730 Q470 440 510 400 Q590 345 425 300 Z"
              fill="#d9bc91"/>
    `,

    museum: `
        <rect width="800" height="500" fill="#e9dfcc"/>
        <rect y="415" width="800" height="85" fill="#ac967d"/>
        ${[70,300,530].map((x,i)=>`
            <rect x="${x}" y="65" width="200" height="310"
                  fill="#faf2dd" stroke="#937b5a" stroke-width="8"/>
            <rect x="${x+25}" y="290" width="150" height="35" fill="#bca58a"/>
            <path d="M${x+65} 160 Q${x+25} 270 ${x+100} 290
                     Q${x+175} 270 ${x+135} 160 Z"
                  fill="${["#ad7959","#788f93","#a58d59"][i]}"/>
            <ellipse cx="${x+100}" cy="160" rx="35" ry="10" fill="#c4af8d"/>
        `).join("")}
    `,

    classroom: `
        <rect width="800" height="500" fill="#e7dfcf"/>
        <rect y="385" width="800" height="115" fill="#b29c80"/>
        <rect x="95" y="45" width="610" height="250" rx="8" fill="#80684f"/>
        <rect x="110" y="60" width="580" height="220" fill="#386d58"/>
        <g stroke="#e9f0de" stroke-width="5">
            <path d="M155 115 H600 M155 160 H520 M155 205 H580"/>
        </g>
        ${[90,330,570].map(x=>`
            <rect x="${x}" y="345" width="170" height="45" rx="5" fill="#d5ad79"/>
            <path d="M${x+15} 390 V485 M${x+155} 390 V485"
                  stroke="#80674f" stroke-width="12"/>
        `).join("")}
    `,

    theatre: `
        <rect width="800" height="500" fill="#bda17c"/>
        <rect x="65" y="40" width="670" height="385" rx="12" fill="#493c45"/>
        <path d="M65 40 H310 Q250 250 150 425 H65 Z" fill="#883a48"/>
        <path d="M735 40 H490 Q550 250 650 425 H735 Z" fill="#883a48"/>
        <path d="M65 40 Q400 185 735 40 V110
                 Q400 240 65 110 Z" fill="#a54c59"/>
        <rect x="150" y="375" width="500" height="55" fill="#bb9971"/>
        <ellipse cx="400" cy="375" rx="160" ry="30" fill="#ebcf93"/>
    `,

    peace: `
        <rect width="800" height="500" fill="#d8e9ee"/>
        <circle cx="400" cy="250" r="185" fill="#fff5d8"/>
        <path d="M240 200 Q310 125 400 195
                 Q485 125 560 200 Q480 195 400 280
                 Q320 195 240 200 Z"
              fill="#ffffff" stroke="#97aab3" stroke-width="4"/>
        <path d="M180 420 Q300 350 400 290 Q500 350 620 420"
              fill="none" stroke="#648d5d" stroke-width="10"/>
        ${Array.from({length:6},(_,i)=>`
            <ellipse cx="${220+i*32}" cy="${390-i*15}"
                     rx="32" ry="13" fill="#87aa76"
                     transform="rotate(-30 ${220+i*32} ${390-i*15})"/>
            <ellipse cx="${580-i*32}" cy="${390-i*15}"
                     rx="32" ry="13" fill="#87aa76"
                     transform="rotate(30 ${580-i*32} ${390-i*15})"/>
        `).join("")}
    `
};

function illustration(key, caption) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 800 500">
            ${art[key] || art.book}
        </svg>`;

    const url = "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(svg);

    return `
    <figure class="photo-card">
        <img src="${url}" alt="${caption}" onclick="openPhoto(this)">
        <figcaption>${caption}</figcaption>
        <span class="photo-credit">Учебная иллюстрация</span>
    </figure>`;
}

function openPhoto(img) {
    $("largePhoto").src = img.src;
    $("photoCaption").textContent = img.alt;
    $("photoDialog").showModal();
}

// ==========================================
// СОЗДАНИЕ СТРАНИЦ
// ==========================================

const pages = [];

function add(lesson, title, time, html, type = "normal") {
    pages.push({lesson, title, time, html, type});
}

add(C.start, "Главная страница", 2, `
    <div class="cover">
        <p class="gold">${C.section}</p>
        <h1>${C.title}</h1>

        <div class="topic first">
            <small>УРОК №${C.start} · 40 МИНУТ</small>
            ${C.topics[0]}
        </div>

        <div class="topic">
            <small>УРОК №${C.start+1} · 40 МИНУТ</small>
            ${C.topics[1]}
        </div>
    </div>

    ${rule("Цели занятия", C.goal)}
`, "start");

function addTheory(lesson, item, time) {
    const [title, paragraphs, key, caption, example] = item;

    const content = paragraphs.map(p => `<p>${p}</p>`).join("");

    const html = key
        ? `<div class="reading-layout">
              <div>${content}</div>
              <div>${illustration(key, caption || title)}</div>
           </div>`
        : content;

    add(lesson, title, time, `
        <h1>${title}</h1>
        ${html}
        ${example ? rule("Запомните", example) : ""}
    `);
}

function addNotes(lesson, title, items, time) {
    add(lesson, title, time, `
        <h1>Запишите в тетрадь</h1>
        <p class="writing-label">✍ КОНСПЕКТ</p>
        <div class="notebook">
            <h2>${title}</h2>
            ${items.map((t,i)=>`<p>${blue((i+1)+".")} ${t}</p>`).join("")}
        </div>
    `);
}

function addExercise(lesson, exercise, time, number) {
    add(lesson, "Упр. " + number + ". " + exercise[0], time, `
        <h1>${exercise[0]}</h1>
        <p class="writing-label">✍ ВЫПОЛНИТЕ В ТЕТРАДИ</p>
        <div class="instruction">${exercise[1]}</div>
        ${questions(exercise[2])}
    `, "exercise");
}

// ПЕРВЫЕ 40 МИНУТ:
// 2 + 20 + 6 + 6 + 6 = 40

C.first.forEach(item => addTheory(C.start, item, 4));

addNotes(C.start, "Конспект №1", C.notes[0], 6);
addNotes(C.start, "Конспект №2", C.notes[1], 6);
addExercise(C.start, C.exercises[0], 6, 1);

// ВТОРЫЕ 40 МИНУТ:
// 20 + 6 + 12 + 2 = 40
// ИЛИ 16 + 6 + 12 + 4 + 2 = 40

C.second.forEach(item => addTheory(C.start+1, item, 4));

addNotes(C.start+1, "Конспект №3", C.notes[2], 6);

C.exercises.slice(1).forEach((exercise,i) => {
    addExercise(C.start+1, exercise, 3, i+2);
});

if (C.game) {
    add(C.start+1, "Командная игра", 4, "", "game");
}

add(C.start+1, C.final ? "Итоги зачёта" : "Домашнее задание", 2, `
    <h1>${C.final ? "Завершение учебного года" : "Домашнее задание"}</h1>

    ${C.homework.map((h,i)=>`
        <div class="homework">
            <h2>${i+1}. ${h[0]}</h2>
            <p>${h[1]}</p>
        </div>
    `).join("")}

    ${conclusion(C.summary)}

    <div class="farewell">
        <h1>Спасибо за урок!</h1>
        <p class="green">
            ${C.final ? "Учебная программа завершена!" : "До следующей встречи!"}
        </p>
        <strong class="gold">BY DARKHAN</strong>
    </div>
`, "homework");

// ==========================================
// НАСТРОЙКИ УЧЕНИКОВ
// ==========================================

function updateAttendance() {
    $("attendance").textContent = count + " / 25";
}

function effectiveTeam(n = count, m = mode) {
    return Boolean(C.game) && n >= 4 && m !== "individual";
}

function openSettings() {
    $("studentCount").value = count;
    $("lessonMode").value = C.game ? mode : "individual";
    $("lessonMode").disabled = !C.game;
    previewSettings();
    $("settingsDialog").showModal();
}

function setCount(n) {
    $("studentCount").value = normalizeCount(n);
    previewSettings();
}

function changeCount(n) {
    setCount(Number($("studentCount").value) + n);
}

function previewSettings() {
    const n = normalizeCount($("studentCount").value);

    $("quickCount").querySelectorAll("button").forEach(b => {
        b.classList.toggle("active", Number(b.textContent) === n);
    });

    if (n === 0) {
        $("settingsPreview").innerHTML =
            important("Внимание", "Нет присутствующих учеников.");
        return;
    }

    if (effectiveTeam(n, $("lessonMode").value)) {
        $("settingsPreview").innerHTML = `
            <div class="scoreboard">
                <div class="team">
                    Команда 1
                    <strong>${Math.ceil(n/2)}</strong>
                    <small>участников</small>
                </div>
                <div class="team second">
                    Команда 2
                    <strong>${Math.floor(n/2)}</strong>
                    <small>участников</small>
                </div>
            </div>`;
    } else {
        $("settingsPreview").innerHTML =
            conclusion("Индивидуальная работа. Учащихся: " + n);
    }
}

function saveSettings() {
    const newCount = normalizeCount($("studentCount").value);
    const newMode = C.game ? $("lessonMode").value : "individual";

    if ((newCount !== count || newMode !== mode) && game.started) {
        if (!confirm("Изменение настроек сбросит игру. Продолжить?")) return;
        resetGame();
    }

    count = newCount;
    mode = newMode;

    save(storageKey, {count, mode});

    if (!count && running) toggleTimer();

    updateAttendance();

    $("settingsDialog").close();

    render();

    notify("Настройки сохранены.");
}

$("quickCount").innerHTML =
    [0,5,10,12,15,20,24,25].map(n =>
        `<button onclick="setCount(${n})">${n}</button>`
    ).join("");

// ==========================================
// КОМАНДНАЯ ИГРА
// ==========================================

let game = {
    started: false,
    team: false,
    index: 0,
    scores: [0,0],
    selected: null,
    checked: false,
    finished: false
};

function resetGame() {
    game = {
        started: false,
        team: false,
        index: 0,
        scores: [0,0],
        selected: null,
        checked: false,
        finished: false
    };
}

function startGame() {
    if (!count || !C.game) return;

    resetGame();

    game.started = true;
    game.team = effectiveTeam();

    render();
}

function scoreboard(active = true) {
    const names = C.teams || ["Знатоки", "Исследователи"];

    return `
        <div class="scoreboard">
            ${game.scores.map((score,i)=>`
                <div class="team ${i===1?"second":""}
                     ${active && game.index%2===i?"active":""}">
                    <b>${names[i]}</b>
                    <small>
                        ${i===0?Math.ceil(count/2):Math.floor(count/2)}
                        участников
                    </small>
                    <strong>${score} / 100</strong>
                    <small>${active && game.index%2===i?"ВАШ ХОД":"БАЛЛЫ"}</small>
                </div>
            `).join("")}
        </div>`;
}

function renderGame() {

    if (!game.started) {
        return `
            <h1>Интеллектуальное закрепление</h1>

            ${rule("Правила",
                "Ответьте на восемь вопросов. " +
                "Каждый вопрос имеет четыре варианта ответа.")}

            ${effectiveTeam() ? scoreboard(false) :
                conclusion("Индивидуальный режим")}

            <p>
                Ученики отвечают со своих мест.
                Преподаватель выбирает вариант ответа слева.
            </p>

            ${table(
                ["Раунд","Баллы за вопрос"],
                [["1",10],["2",20],["3",30],["4",40]]
            )}
        `;
    }

    if (game.finished) {

        const names = C.teams || ["Знатоки","Исследователи"];

        const winner = !game.team
            ? "Индивидуальная работа завершена"
            : game.scores[0] === game.scores[1]
                ? "Ничья!"
                : "Победила команда «" +
                  names[game.scores[0]>game.scores[1]?0:1] + "»";

        return `
            <div class="cover">
                <h1>${winner}</h1>
                ${game.team ? scoreboard(false) : ""}
                ${conclusion(C.summary)}
            </div>`;
    }

    if (!game.team) {
        return `
            <h1>Индивидуальная проверка</h1>
            <p class="writing-label">Запишите ответы в тетрадь</p>
            ${questions(C.game.map(q=>[
                q[0] + "<p>" +
                q[1].map((o,i)=>"АБВГ"[i]+". "+o).join("<br>") +
                "</p>",
                q[1][q[2]] + ". " + q[3]
            ]))}
        `;
    }

    const task = C.game[game.index];
    const points = (Math.floor(game.index/2)+1)*10;

    return `
        <h1>Интеллектуальная игра</h1>

        ${scoreboard()}

        <div class="example">
            Вопрос ${game.index+1} из ${C.game.length}
            · ${points} баллов
        </div>

        <h2>${task[0]}</h2>

        <div class="options">

            ${task[1].map((option,i)=>{

                const css = game.checked && i===task[2]
                    ? "correct"
                    : game.checked && i===game.selected
                        ? "wrong"
                        : i===game.selected ? "selected" : "";

                return `
                    <div class="option ${css}">
                        ${blue("АБВГ"[i]+".")} ${option}
                    </div>`;
            }).join("")}

        </div>

        ${game.checked
            ? conclusion(
                (game.selected===task[2]
                    ? "Верно! +"+points+" баллов. "
                    : "Правильный вариант: "+"АБВГ"[task[2]]+". ") +
                task[3]
              )
            : '<p class="writing-label">ОБСУДИТЕ ОТВЕТ</p>'}
    `;
}

function selectOption(i) {
    if (!game.started || !game.team || game.finished || game.checked) return;

    game.selected = i;
    render();
}

function checkGame(skip = false) {
    if (!game.started || !game.team || game.checked || game.finished) return;

    if (!skip && game.selected === null) return;

    if (skip) game.selected = null;

    if (game.selected === C.game[game.index][2]) {
        game.scores[game.index%2] +=
            (Math.floor(game.index/2)+1)*10;
    }

    game.checked = true;
    render();
}

function nextGame() {
    if (!game.checked || game.finished) return;

    game.index++;
    game.selected = null;
    game.checked = false;

    if (game.index >= C.game.length) {
        game.finished = true;
    }

    render();
    $("bookArea").scrollTop = 0;
}

function finishIndividual() {
    game.finished = true;
    render();
}

function restartGame() {
    if (!confirm("Начать заново?")) return;
    resetGame();
    render();
}

// ==========================================
// КНОПКИ И НАВИГАЦИЯ
// ==========================================

let current = 0;

function btn(text, action, disabled = false, css = "") {
    return `<button class="${css}" onclick="${action}"
                    ${disabled?"disabled":""}>${text}</button>`;
}

function renderActions() {
    const page = pages[current];

    let html = "";

    if (page.type === "start") {
        html = btn("▶ Начать урок", "startLesson()", !count, "good");
    }

    else if (page.type === "exercise") {
        html =
            btn("Показать все ответы", "showAnswers(true)") +
            btn("Скрыть все ответы", "showAnswers(false)") +
            btn("Открыть доску", "openBoard()");
    }

    else if (page.type === "game") {

        if (!game.started) {
            html =
                btn("Настройки учеников", "openSettings()") +
                btn("Начать закрепление", "startGame()", !count, "good");
        }

        else if (game.finished) {
            html =
                btn("Начать заново", "restartGame()") +
                btn("Далее →", "move(1)");
        }

        else if (!game.team) {
            html =
                btn("Показать ответы", "showAnswers(true)") +
                btn("Скрыть ответы", "showAnswers(false)") +
                btn("Завершить проверку", "finishIndividual()");
        }

        else {
            html =
                Array.from("АБВГ").map((x,i)=>
                    btn(
                        (game.selected===i?"✓ ":"")+"Вариант "+x,
                        `selectOption(${i})`,
                        game.checked
                    )
                ).join("") +

                btn("Проверить ответ", "checkGame()",
                    game.selected===null || game.checked, "good") +

                btn("Пропустить", "checkGame(true)",
                    game.checked, "bad") +

                btn("Следующий вопрос →", "nextGame()", !game.checked);
        }
    }

    else if (page.type === "homework") {
        html =
            btn("Распечатать страницу", "window.print()") +
            btn("Завершить урок", "finishLesson()", false, "good") +
            btn("На главную", "goTo(0)");
    }

    else {
        html = btn("Распечатать страницу", "window.print()");
    }

    $("actions").innerHTML =
        '<div class="label">ДЕЙСТВИЯ</div>'+html;
}

function renderNavigation() {
    const sidebar = document.querySelector(".sidebar-scroll");
    const position = sidebar.scrollTop;

    $("navigation").innerHTML = pages.map((p,i)=>`

        ${i===0 || p.lesson!==pages[i-1]?.lesson
            ? `<div class="section-title ${i===0?"first":""}">
                 УРОК №${p.lesson}<br>
                 ${C.topics[p.lesson-C.start]}<br>40 МИНУТ
               </div>`
            : ""}

        <button class="nav-btn ${current===i?"active":""}"
                onclick="goTo(${i})">
            ${i+1}. ${p.title}
        </button>

    `).join("");

    sidebar.scrollTop = position;
}

function render() {
    const p = pages[current];

    $("page").innerHTML = `
        <div class="page-heading">
            <span>${C.paragraph} · УРОК №${p.lesson}</span>
            <span class="page-time">◷ ${p.time} мин</span>
        </div>

        ${p.type==="game" ? renderGame() : p.html}
    `;

    $("lessonBadge").textContent = "УРОК №"+p.lesson;

    $("pageNumber").textContent =
        `${current+1} / ${pages.length}`;

    $("progress").style.width =
        (current+1)/pages.length*100+"%";

    $("prev").disabled = current===0;
    $("next").disabled = current===pages.length-1;

    renderNavigation();
    renderActions();
}

function goTo(i) {
    if (i<0 || i>=pages.length) return;

    stopReading();

    current = i;
    render();

    $("bookArea").scrollTop = 0;
    $("bookArea").scrollLeft = 0;

    if (innerWidth<=800) {
        document.body.classList.add("menu-hidden");
    }
}

function move(n) {
    goTo(current+n);
}

function openReference() {
    $("referenceContent").innerHTML =
        table(["Понятие","Определение"], C.reference);

    $("referenceDialog").showModal();
}

// ==========================================
// ТАЙМЕР И ЧАСЫ
// ==========================================

let remaining = 4800;
let running = false;
let deadline = 0;
let interval = null;
let stageNotified = false;

function fmt(n) {
    return String(Math.floor(n/60)).padStart(2,"0") +
           ":" + String(n%60).padStart(2,"0");
}

function updateTimer() {
    $("timer").textContent = fmt(remaining);

    $("timer").style.color =
        remaining<=300 ? "#ff9696" : "#ffdc9d";

    $("timerStage").textContent = remaining>2400
        ? "Урок №"+C.start+": "+fmt(remaining-2400)
        : remaining>0
            ? "Урок №"+(C.start+1)+": "+fmt(remaining)
            : "Занятие завершено";
}

function tick() {
    if (!running) return;

    remaining = Math.max(0, Math.ceil((deadline-Date.now())/1000));

    updateTimer();

    if (remaining<=2400 && remaining>0 && !stageNotified) {
        stageNotified = true;
        notify("Первые 40 минут завершены. Переходите к следующей части.");
    }

    if (!remaining) {
        running = false;
        clearInterval(interval);
        $("timerButton").textContent = "Старт";
        notify("80 минут истекли.");
    }
}

function toggleTimer() {
    if (running) {
        tick();
        running = false;
        clearInterval(interval);
        $("timerButton").textContent = "Старт";
        return;
    }

    if (!count) {
        notify("Нет присутствующих учеников.");
        return;
    }

    if (!remaining) {
        remaining = 4800;
        stageNotified = false;
    }

    running = true;
    deadline = Date.now()+remaining*1000;

    $("timerButton").textContent = "Пауза";

    interval = setInterval(tick,250);

    updateTimer();
}

function resetTimer() {
    clearInterval(interval);

    remaining = 4800;
    running = false;
    stageNotified = false;

    $("timerButton").textContent = "Старт";

    updateTimer();
}

function startLesson() {
    if (!count) return;
    if (!running) toggleTimer();
    notify("Занятие началось.");
}

function finishLesson() {
    if (running) toggleTimer();
    stopReading();
    notify("Занятие завершено.");
}

function updateClock() {
    const now = new Date(Date.now()+5*60*60*1000);

    $("clock").textContent = now.toISOString().slice(11,19);

    $("date").textContent = new Intl.DateTimeFormat("ru-RU",{
        timeZone:"UTC",
        day:"numeric",
        month:"long",
        year:"numeric"
    }).format(now);
}

// ==========================================
// МАСШТАБ
// ==========================================

function applyZoom() {
    zoom = Math.max(50,Math.min(200,zoom));

    document.documentElement.style.setProperty("--zoom",zoom/100);

    $("zoomValue").textContent = zoom+"%";

    save(C.id+"-zoom",zoom);
}

function changeZoom(n) {
    zoom += n;
    applyZoom();
}

function resetZoom() {
    zoom = 100;
    applyZoom();
}

function toggleMenu() {
    document.body.classList.toggle("menu-hidden");
}

async function fullscreen() {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await document.documentElement.requestFullscreen();
        }
    } catch {
        notify("Используйте клавишу F11.");
    }
}

// ==========================================
// ИНТЕРАКТИВНАЯ ДОСКА
// ==========================================

const canvas = $("boardCanvas");
const ctx = canvas.getContext("2d");

let penColor = "#155bb5";
let pointer = null;
let last = null;

const history = [];

function fillBoard() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

function openBoard() {
    $("boardDialog").showModal();
}

function setPen(color) {
    penColor = color;
}

function rememberBoard() {
    history.push(ctx.getImageData(0,0,canvas.width,canvas.height));

    if (history.length>15) history.shift();
}

function undoBoard() {
    if (history.length) {
        ctx.putImageData(history.pop(),0,0);
    }
}

function clearBoard() {
    if (!confirm("Очистить доску?")) return;

    rememberBoard();
    fillBoard();
}

function position(e) {
    const r = canvas.getBoundingClientRect();

    return {
        x:(e.clientX-r.left)*canvas.width/r.width,
        y:(e.clientY-r.top)*canvas.height/r.height
    };
}

canvas.addEventListener("pointerdown",e=>{
    if (pointer!==null || e.button>0) return;

    e.preventDefault();

    rememberBoard();

    pointer = e.pointerId;

    canvas.setPointerCapture(pointer);

    last = position(e);

    ctx.lineWidth = Number($("penWidth").value);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.fillStyle = penColor;

    ctx.beginPath();
    ctx.arc(last.x,last.y,ctx.lineWidth/2,0,Math.PI*2);
    ctx.fill();
});

canvas.addEventListener("pointermove",e=>{
    if (pointer!==e.pointerId) return;

    const next = position(e);

    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(next.x,next.y);
    ctx.stroke();

    last = next;
});

function stopDrawing(e) {
    if (pointer!==e.pointerId) return;

    pointer = null;
    last = null;

    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }
}

canvas.addEventListener("pointerup",stopDrawing);
canvas.addEventListener("pointercancel",stopDrawing);
canvas.addEventListener("lostpointercapture",stopDrawing);

// ==========================================
// ОЗВУЧИВАНИЕ
// ==========================================

function stopReading() {
    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }
}

function readPage() {
    if (!("speechSynthesis" in window)) {
        notify("Озвучивание недоступно.");
        return;
    }

    stopReading();

    const voice = speechSynthesis.getVoices()
        .find(v=>v.lang.startsWith("ru"));

    const nodes = $("page").querySelectorAll(
        "h1,h2,p,li,td,.question-title"
    );

    nodes.forEach(node=>{
        if (node.closest(".answer")) return;

        const text = node.innerText.trim();

        if (!text) return;

        const s = new SpeechSynthesisUtterance(text);

        s.lang = "ru-RU";
        s.rate = .9;

        if (voice) s.voice = voice;

        speechSynthesis.speak(s);
    });
}

// ==========================================
// УВЕДОМЛЕНИЯ И КЛАВИШИ
// ==========================================

let messageTimer;

function notify(text) {
    clearTimeout(messageTimer);

    $("notification").textContent = text;
    $("notification").style.display = "block";

    messageTimer = setTimeout(()=>{
        $("notification").style.display = "none";
    },4000);
}

document.addEventListener("keydown",e=>{
    if (document.querySelector("dialog[open]")) return;

    if (["INPUT","SELECT","BUTTON","SUMMARY","TEXTAREA"]
        .includes(e.target.tagName)) return;

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key==="ArrowRight") move(1);
    if (e.key==="ArrowLeft") move(-1);
    if (e.key==="+") changeZoom(10);
    if (e.key==="-") changeZoom(-10);
    if (e.key==="0") resetZoom();
    if (e.key.toLowerCase()==="f") fullscreen();
    if (e.key.toLowerCase()==="m") toggleMenu();
});

// ==========================================
// ЗАПУСК
// ==========================================

fillBoard();

if (innerWidth<=800) {
    document.body.classList.add("menu-hidden");
}

updateAttendance();
updateTimer();
updateClock();
applyZoom();
render();

setInterval(updateClock,1000);

const minutes1 = pages
    .filter(p=>p.lesson===C.start)
    .reduce((s,p)=>s+p.time,0);

const minutes2 = pages
    .filter(p=>p.lesson===C.start+1)
    .reduce((s,p)=>s+p.time,0);

console.log(C.id, "Страниц:", pages.length);
console.log("Время:",minutes1,"+",minutes2,"=",minutes1+minutes2);

console.assert(minutes1===40 && minutes2===40,
    "Проверьте распределение времени.");

console.log("BY DARKHAN");