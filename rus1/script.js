
const $ = id => document.getElementById(id);

const MAX_STUDENTS = 25;
const LESSON_MINUTES = 80;

// ==========================================
// 1. СОХРАНЕНИЕ НАСТРОЕК
// ==========================================

function load(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}

function save(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {}
}

function normalizeCount(value) {
    return Math.max(
        0,
        Math.min(25, Math.floor(Number(value) || 0))
    );
}

const stored = load("rus111-notebook-settings", {}) || {};

let settings = {
    count: normalizeCount(stored.count ?? 24),

    mode: ["auto", "team", "individual"].includes(stored.mode)
        ? stored.mode
        : "auto"
};

function recommendedMode() {
    return settings.count < 4 ||
           settings.mode === "individual"
        ? "individual"
        : "team";
}

function updateAttendance() {
    $("attendance").textContent =
        settings.count + " / 25";
}

function openSettings() {
    $("studentCount").value = settings.count;
    $("lessonMode").value = settings.mode;

    previewTeams();

    if (!$("settingsDialog").open) {
        $("settingsDialog").showModal();
    }
}

function closeSettings() {
    $("settingsDialog").close();
}

function setCount(value) {
    $("studentCount").value = normalizeCount(value);
    previewTeams();
}

function changeCount(amount) {
    setCount(Number($("studentCount").value) + amount);
}

function previewTeams() {

    const count = normalizeCount(
        $("studentCount").value
    );

    const mode = $("lessonMode").value;

    document.querySelectorAll(".quick-count button")
        .forEach(button => {
            button.classList.toggle(
                "active",
                Number(button.textContent) === count
            );
        });

    if (count === 0) {
        $("teamPreview").innerHTML = `
            <div class="note">
                Нет присутствующих учеников.
            </div>
        `;
        return;
    }

    if (count < 4 || mode === "individual") {
        $("teamPreview").innerHTML = `
            <div class="conclusion">
                Самостоятельная письменная работа.
                Деление на команды не требуется.
            </div>
        `;
        return;
    }

    $("teamPreview").innerHTML = `
        <div class="preview-teams">

            <div class="team">
                Команда №1
                <strong>${Math.ceil(count / 2)}</strong>
                участников
            </div>

            <div class="team second">
                Команда №2
                <strong>${Math.floor(count / 2)}</strong>
                участников
            </div>

        </div>
    `;
}

function saveSettings() {

    const count = normalizeCount(
        $("studentCount").value
    );

    const mode = $("lessonMode").value;

    const changed =
        count !== settings.count ||
        mode !== settings.mode;

    if (changed && game.started) {
        if (!confirm(
            "Изменение настроек сбросит результаты игры. Продолжить?"
        )) return;
    }

    settings = { count, mode };

    save("rus111-notebook-settings", settings);

    if (changed) resetGameState();

    updateAttendance();
    closeSettings();
    renderPage();

    notify("Настройки сохранены");
}

// ==========================================
// 2. ЦВЕТНЫЕ СЛОВА И РАМКИ
// ==========================================

const blue = text =>
    `<span class="blue">${text}</span>`;

const red = text =>
    `<span class="red">${text}</span>`;

const green = text =>
    `<span class="green">${text}</span>`;

function rule(title, text) {
    return `
        <div class="rule">
            <b class="blue">${title}</b>
            <p>${text}</p>
        </div>
    `;
}

function important(title, text) {
    return `
        <div class="important">
            <b class="red">${title}</b>
            <p>${text}</p>
        </div>
    `;
}

function conclusion(text) {
    return `
        <div class="conclusion">
            <b class="green">Вывод</b>
            <p>${text}</p>
        </div>
    `;
}

function table(headers, rows) {

    return `
        <table class="book-table">
            <thead>
                <tr>
                    ${headers.map(h =>
                        `<th>${h}</th>`
                    ).join("")}
                </tr>
            </thead>

            <tbody>
                ${rows.map(row => `
                    <tr>
                        ${row.map(cell =>
                            `<td>${cell}</td>`
                        ).join("")}
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

// ==========================================
// 3. ФОТОГРАФИИ
// ==========================================

const photos = {

    pushkin: {
        file: "Kiprensky_Pushkin.jpg",
        local: "images/pushkin.jpg",
        caption: "А. С. Пушкин. Портрет работы О. А. Кипренского, 1827 г."
    },

    kazbek: {
        file: "Gergeti_Trinity_Church_and_Mt._Kazbeg_01.jpg",
        local: "images/kazbek.jpg",
        caption: "Гора Казбек и Троицкая церковь в Гергети"
    },

    monastery: {
        file: "Gergeti_Trinity_Church_Kazbeg.jpg",
        local: "images/monastery.jpg",
        caption: "Троицкая церковь в Гергети"
    },

    gorge: {
        file: "Dariali_Gorge_landscape,_Georgia.jpg",
        local: "images/gorge.jpg",
        caption: "Дарьяльское ущелье на Кавказе"
    }

};

// Вычисление адреса Wikimedia через API.
// Если локального изображения нет,
// сайт пробует получить фотографию из интернета.

function photoSources(key) {

    const p = photos[key];

    return [
        p.local,

        "https://commons.wikimedia.org/wiki/Special:FilePath/" +
        encodeURIComponent(p.file) +
        "?width=1000",

        "https://commons.wikimedia.org/wiki/Special:FilePath/" +
        encodeURIComponent(p.file)
    ];
}

function photo(key, hero = false) {

    const p = photos[key];

    if (!p) return "";

    const source =
        "https://commons.wikimedia.org/wiki/File:" +
        encodeURIComponent(p.file);

    return `
        <figure class="photo-card ${hero ? "hero-photo" : ""}">

            <img
                src="${photoSources(key)[0]}"
                alt="${p.caption}"
                data-photo="${key}"
                data-attempt="0"
                decoding="async"
                loading="eager"
                onerror="retryPhoto(this)"
                onclick="openPhoto(this)"
            >

            <div class="photo-error" hidden>

                Изображение недоступно.

                <p>
                    ${p.caption}
                </p>

                <button onclick="reloadPhoto(this, '${key}')">
                    Повторить загрузку
                </button>

            </div>

            <figcaption>${p.caption}</figcaption>

            <span class="photo-credit">

                <a href="${source}"
                   target="_blank"
                   rel="noopener">
                    Wikimedia Commons — источник и лицензия
                </a>

            </span>

        </figure>
    `;
}

async function retryPhoto(img) {

    if (!img.isConnected) return;

    const key = img.dataset.photo;
    const sources = photoSources(key);
    const attempt = Number(img.dataset.attempt) + 1;

    img.dataset.attempt = attempt;

    if (attempt < sources.length) {
        img.src = sources[attempt];
        return;
    }

    // Дополнительная попытка через API Wikimedia.

    if (attempt === sources.length) {

        try {

            const url =
                "https://commons.wikimedia.org/w/api.php?" +
                new URLSearchParams({
                    action: "query",
                    titles: "File:" + photos[key].file,
                    prop: "imageinfo",
                    iiprop: "url",
                    iiurlwidth: "1000",
                    format: "json",
                    origin: "*"
                });

            const response = await fetch(url);

            if (!response.ok) throw new Error();

            const data = await response.json();

            const result = Object.values(
                data.query.pages
            )[0];

            const info = result.imageinfo?.[0];

            const imageUrl = info?.thumburl || info?.url;

            if (imageUrl && img.isConnected) {
                img.src = imageUrl;
                return;
            }

        } catch {}
    }

    if (!img.isConnected) return;

    img.hidden = true;

    img.closest("figure")
        .querySelector(".photo-error")
        .hidden = false;
}

function reloadPhoto(button, key) {

    const figure = button.closest("figure");
    const img = figure.querySelector("img");

    figure.querySelector(".photo-error").hidden = true;

    img.hidden = false;
    img.dataset.attempt = "0";
    img.src = photoSources(key)[0];
}

function openPhoto(img) {

    if (!img.complete || !img.naturalWidth) return;

    $("largePhoto").src = img.currentSrc || img.src;

    $("photoCaption").textContent =
        photos[img.dataset.photo].caption;

    $("photoDialog").showModal();
}

function closePhoto() {
    $("photoDialog").close();
}

function withPhoto(content, key) {
    return `
        <div class="reading-layout">

            <div>${content}</div>

            <div>${photo(key)}</div>

        </div>
    `;
}

// ==========================================
// 4. ВОПРОСЫ И ОТВЕТЫ
// ==========================================

function answer(text, opened = false, handler = "") {

    return `
        <details class="answer"

            ${opened ? "open" : ""}

            ${handler ? `ontoggle="${handler}"` : ""}>

            <summary>
                ${opened ? "Скрыть ответ" : "Показать ответ"}
            </summary>

            <div class="answer-text">
                <b class="green">Ответ:</b>
                <p>${text}</p>
            </div>

        </details>
    `;
}

function question(number, text, solution) {

    return `
        <div class="question">

            <div class="question-title">
                ${blue(number + ".")} ${text}
            </div>

            ${answer(solution)}

        </div>
    `;
}

function questions(items) {

    return items.map((item, index) =>

        question(
            index + 1,
            item[0],
            item[1]
        )

    ).join("");
}

function exercise(number, title, instruction, example) {

    return `
        <div class="exercise-heading">

            <span class="exercise-number">
                ${number}
            </span>

            <strong>${title}</strong>

        </div>

        <p>
            <span class="writing-label">
                ✍ ВЫПОЛНИТЕ В ТЕТРАДИ · 5 МИНУТ
            </span>
        </p>

        <div class="instruction">

            <b class="blue">Как выполнять:</b>

            <p>${instruction}</p>

        </div>

        ${example ? `
            <div class="example">
                <b class="red">Образец выполнения:</b>
                <p>${example}</p>
            </div>
        ` : ""}
    `;
}

document.addEventListener("toggle", event => {

    const element = event.target;

    if (
        !element.matches?.(".answer") ||
        !element.isConnected
    ) return;

    element.querySelector("summary").textContent =
        element.open
            ? "Скрыть ответ"
            : "Показать ответ";

}, true);

function showAnswers(value) {

    $("page").querySelectorAll(".answer")
        .forEach(item => {
            item.open = value;
        });
}

// ==========================================
// 5. СТИХОТВОРЕНИЕ
// ==========================================

const poem = `Высоко над семьею гор,
Казбек, твой царственный шатер
Сияет вечными лучами.
Твой монастырь за облаками,
Как в небе реющий ковчег,
Парит, чуть видный, над горами.

Далекий, вожделенный брег!
Туда б, сказав прости ущелью,
Подняться к вольной вышине!
Туда б, в заоблачную келью,
В соседство бога скрыться мне!..`;

function poemBlock() {

    return `
        <div class="poem">

            ${poem.replace(/\n/g, "<br>")}

            <div class="poem-author">
                А. С. Пушкин, 1829 г.
            </div>

        </div>
    `;
}

// ==========================================
// 6. СТРАНИЦЫ УЧЕБНИКА
// ==========================================

const pages = [

    // ======================================
    // 1. ГЛАВНАЯ — 2 МИНУТЫ
    // ======================================

    {
        menu: "📖 Главная",
        time: 2,
        label: "РУССКИЙ ЯЗЫК И ЛИТЕРАТУРА",
        type: "start",

        html: `
            <div class="cover">

                <p class="gold">
                    РАЗДЕЛ 1. ТУРИЗМ. ЭКОТУРИЗМ
                </p>

                <h1>
                    Александр Сергеевич Пушкин
                </h1>

                <p class="cover-title">
                    § 1.1.1. «Монастырь на Казбеке»
                </p>

                ${photo("kazbek", true)}

                <div class="cover-meta">
                    <span>1 КУРС</span>
                    <span>80 МИНУТ</span>
                    <span>ЛИТЕРАТУРА</span>
                </div>

            </div>

            <div class="rule">

                <b class="blue">Цель урока</b>

                <p>
                    Познакомиться с произведением,
                    определить его тему и идею,
                    научиться находить художественные
                    средства и выполнять письменный
                    анализ литературного текста.
                </p>

            </div>
        `
    },

    // ======================================
    // 2. ЧТЕНИЕ. БИОГРАФИЯ — 5 МИНУТ
    // ======================================

    {
        menu: "📚 Чтение. Биография",
        time: 5,
        label: "ПРОЧИТАЙТЕ ТЕКСТ ПО ОЧЕРЕДИ",

        html: `
            <h1>Александр Сергеевич Пушкин</h1>

            ${withPhoto(`

                <h2>1799–1837</h2>

                <p>
                    ${blue("Александр Сергеевич Пушкин")}
                    — выдающийся русский поэт,
                    прозаик и драматург.

                    Его творчество занимает особое место
                    в истории русской литературы.
                    Пушкин внёс значительный вклад
                    в развитие литературного языка.
                </p>

                <p>
                    Поэт родился в Москве
                    в 1799 году.

                    В 1811 году он поступил
                    в Царскосельский лицей.
                    Именно здесь начал активно
                    заниматься литературным творчеством.
                </p>

                <p>
                    В своих произведениях Пушкин
                    обращался к темам любви,
                    дружбы, свободы,
                    человеческого достоинства
                    и красоты природы.
                </p>

                <p>
                    Особое внимание поэт уделял
                    ${red("внутреннему миру человека")}:
                    его чувствам, мечтам,
                    переживаниям и стремлениям.
                </p>

                <p>
                    Природа в его стихотворениях
                    часто помогает раскрывать
                    настроение лирического героя
                    и передавать глубокие размышления.
                </p>

            `, "pushkin")}

            <div class="note">
                Прочитайте текст вслух по абзацам.
                Остальные ученики внимательно слушают.
            </div>
        `
    },

    // ======================================
    // 3. ЧТЕНИЕ. ИСТОРИЯ СОЗДАНИЯ — 5 МИНУТ
    // ======================================

    {
        menu: "🏔 Чтение. История создания",
        time: 5,
        label: "ЧИТАЕМ УЧЕБНЫЙ ТЕКСТ",

        html: `
            <h1>Путешествие на Кавказ</h1>

            ${withPhoto(`

                <p>
                    В ${red("1829 году")}
                    Александр Сергеевич Пушкин
                    путешествовал по Кавказу.

                    Величественные горы,
                    снежные вершины и глубокие ущелья
                    произвели на него сильное впечатление.
                </p>

                <p>
                    Кавказская природа вдохновила
                    поэта на создание литературных
                    произведений.

                    Одним из них стало стихотворение
                    ${blue("«Монастырь на Казбеке»")}.
                </p>

                <p>
                    Автор изображает монастырь,
                    возвышающийся над облаками.

                    Лирический герой восхищается
                    окружающим пейзажем и мечтает
                    оказаться в этом отдалённом месте.
                </p>

                <p>
                    Горная высота становится
                    художественным образом,
                    связанным со свободой,
                    духовным покоем и уединением.
                </p>

                <p>
                    Описание природы постепенно
                    превращается в размышление
                    о желаниях и стремлениях человека.
                </p>

            `, "gorge")}

            ${important(
                "Главная особенность",
                "Природа помогает раскрыть внутренний мир героя."
            )}
        `
    },

    // ======================================
    // 4. ЧТЕНИЕ СТИХОТВОРЕНИЯ — 6 МИНУТ
    // ======================================

    {
        menu: "📖 Чтение стихотворения",
        time: 6,
        label: "ВЫРАЗИТЕЛЬНОЕ ЧТЕНИЕ",
        type: "reading",

        html: `
            <h1>Монастырь на Казбеке</h1>

            ${withPhoto(poemBlock(), "monastery")}

            <div class="note">

                <b>Порядок чтения:</b>

                <ol>

                    <li>
                        Первый ученик читает
                        первые шесть строк.
                    </li>

                    <li>
                        Второй ученик читает
                        оставшиеся пять строк.
                    </li>

                    <li>
                        Остальные следят за текстом.
                    </li>

                    <li>
                        Обратите внимание на изменение
                        настроения лирического героя.
                    </li>

                </ol>

            </div>
        `
    },

    // ======================================
    // 5. СЛОВАРНАЯ РАБОТА — 3 МИНУТЫ
    // ======================================

    {
        menu: "📘 Словарная работа",
        time: 3,
        label: "ОБЪЯСНЕНИЕ НОВЫХ СЛОВ",

        html: `
            <h1>Значение незнакомых слов</h1>

            ${table(
                ["Слово", "Значение"],
                [
                    [blue("Казбек"),
                     "Горная вершина Кавказа."],

                    [blue("Реющий"),
                     "Парящий в воздухе."],

                    [blue("Ковчег"),
                     "Судно, связанное с библейским преданием о спасении."],

                    [blue("Вожделенный"),
                     "Сильно желанный."],

                    [blue("Брег"),
                     "Устаревшая форма слова «берег»."],

                    [blue("Келья"),
                     "Небольшое помещение для монаха."],

                    [blue("Вышина"),
                     "Высота."],

                    [blue("Заоблачный"),
                     "Находящийся высоко, за облаками."]
                ]
            )}

            <div class="note">
                Сейчас переписывать таблицу не нужно.
                Внимательно прочитайте значения слов.
            </div>
        `
    },

    // ======================================
    // 6. ТЕМА И ИДЕЯ — 3 МИНУТЫ
    // ======================================

    {
        menu: "💡 Объяснение. Тема и идея",
        time: 3,
        label: "ОБЪЯСНЕНИЕ МАТЕРИАЛА",

        html: `
            <h1>Тема и основная идея</h1>

            ${rule(
                "Тема",
                "То, о чём говорится в произведении."
            )}

            ${important(
                "Идея",
                "Главная мысль произведения."
            )}

            <h2>Тема стихотворения</h2>

            <p>
                Красота горной природы Кавказа
                и стремление человека
                к духовной свободе.
            </p>

            <h2>Основная идея</h2>

            <p>
                Величественная природа пробуждает
                в человеке глубокие размышления.

                Лирический герой мечтает
                обрести внутреннюю свободу,
                уединение и духовный покой.
            </p>

            ${conclusion(
                "Тема — о чём говорится? " +
                "Идея — какую мысль передаёт произведение?"
            )}
        `
    },

    // ======================================
    // 7. ЖАНР И КОМПОЗИЦИЯ — 3 МИНУТЫ
    // ======================================

    {
        menu: "📝 Жанр и композиция",
        time: 3,
        label: "ОБЪЯСНЕНИЕ МАТЕРИАЛА",

        html: `
            <h1>Жанр и композиция</h1>

            ${rule(
                "Лирика",
                "Род литературы, передающий мысли, " +
                "чувства и переживания человека."
            )}

            <p>
                «Монастырь на Казбеке» —
                лирическое стихотворение
                с элементами
                ${blue("пейзажной")}
                и ${blue("философской лирики")}.
            </p>

            ${rule(
                "Композиция",
                "Построение произведения и расположение " +
                "его смысловых частей."
            )}

            <h2>Первая часть</h2>

            <p>
                Первые шесть строк описывают
                горы, облака и монастырь.
                Основное чувство —
                ${red("восхищение природой")}.
            </p>

            <h2>Вторая часть</h2>

            <p>
                Последние пять строк раскрывают
                желания и размышления
                лирического героя.
            </p>

            ${conclusion(
                "Описание природы → Восхищение → " +
                "Размышление → Стремление к свободе."
            )}
        `
    },

    // ======================================
    // 8. ХУДОЖЕСТВЕННЫЕ СРЕДСТВА — 3 МИНУТЫ
    // ======================================

    {
        menu: "🎨 Художественные средства",
        time: 3,
        label: "ОБЪЯСНЕНИЕ МАТЕРИАЛА",

        html: `
            <h1>Средства выразительности</h1>

            ${rule(
                "Эпитет",
                "Образное определение предмета. " +
                "Пример: " +
                red("«царственный шатер»") +
                ". Слово подчёркивает величие горы."
            )}

            ${rule(
                "Сравнение",
                "Сопоставление предметов " +
                "на основе сходства. Пример: " +
                red("«Как в небе реющий ковчег»") +
                ". Монастырь сравнивается с ковчегом."
            )}

            ${rule(
                "Метафора",
                "Перенос значения на основе сходства. " +
                "Пример: " +
                red("«семьею гор»") +
                ". Горы образно названы семьёй."
            )}

            ${important(
                "Запомните",
                "Сравнение часто содержит слова «как», " +
                "«словно», «будто». Эпитет образно " +
                "характеризует предмет, а метафора " +
                "создаёт образ через перенос значения."
            )}

            ${table(
                ["Образ", "Возможное значение"],
                [
                    [blue("Горы"), "Величие природы."],
                    [blue("Монастырь"), "Уединение и покой."],
                    [blue("Высота"), "Духовная свобода."]
                ]
            )}
        `
    },

    // ======================================
    // 9. КРАТКИЙ КОНСПЕКТ — 4 МИНУТЫ
    // ======================================

    {
        menu: "📓 Краткий конспект",
        time: 4,
        label: "ЗАПИШИТЕ В ТЕТРАДЬ",

        html: `
            <h1>Краткий конспект</h1>

            <p class="writing-label">
                ✍ ЗАПИШИТЕ В ТЕТРАДЬ · 4 МИНУТЫ
            </p>

            <div class="notebook">

                <p class="blue">
                    А. С. Пушкин.
                    «Монастырь на Казбеке».
                </p>

                <p>
                    ${blue("Год создания:")} 1829.
                </p>

                <p>
                    ${blue("Жанр:")}
                    лирическое стихотворение.
                </p>

                <p>
                    ${red("Тема:")}
                    красота природы и духовная свобода.
                </p>

                <p>
                    ${red("Идея:")}
                    стремление к духовному покою.
                </p>

                <p>
                    ${blue("Художественные средства:")}
                    эпитет, сравнение, метафора.
                </p>

            </div>

            <div class="note">
                После записи конспекта
                приступите к письменным упражнениям.
            </div>
        `
    },

    // ======================================
    // 10. УПРАЖНЕНИЕ №1 — 5 МИНУТ
    // ======================================

    {
        menu: "✍ Упр. 1. Письменные ответы",
        time: 5,
        label: "ПИСЬМЕННАЯ РАБОТА",
        type: "exercise",

        html: `
            <h1>Ответьте письменно на вопросы</h1>

            ${exercise(
                1,
                "Понимание прочитанного",
                "Запишите номер вопроса. " +
                "Дайте ответ полным предложением. " +
                "Переписывать сами вопросы не обязательно.",

                "Где родился Пушкин?<br>" +
                blue("Пушкин родился в Москве.")
            )}

            ${questions([
                [
                    "В каком году было написано стихотворение?",
                    "Стихотворение было написано в 1829 году."
                ],
                [
                    "Где находится гора Казбек?",
                    "Гора Казбек находится на Кавказе."
                ],
                [
                    "Какую природу описывает автор?",
                    "Автор описывает величественную горную природу."
                ],
                [
                    "О чём мечтает лирический герой?",
                    "Лирический герой мечтает о духовной свободе и уединении."
                ]
            ])}

            <p class="red">
                Сначала запишите свои ответы.
                Затем проверьте их вместе с преподавателем.
            </p>
        `
    },

    // ======================================
    // 11. УПРАЖНЕНИЕ №2 — 5 МИНУТ
    // ======================================

    {
        menu: "✍ Упр. 2. Заполните пропуски",
        time: 5,
        label: "ПИСЬМЕННАЯ РАБОТА",
        type: "exercise",

        html: `
            <h1>Вставьте пропущенные слова</h1>

            ${exercise(
                2,
                "Восстановите предложения",
                "Перепишите предложения в тетрадь, " +
                "вставляя подходящие слова. " +
                "Подчеркните вставленные слова.",

                "Пушкин родился в ______.<br>" +
                "Пушкин родился в " +
                red("Москве") + "."
            )}

            <div class="note">
                <b>Слова для справок:</b>

                <p class="blue">
                    Кавказу, ковчегом, облаками, свободе.
                </p>
            </div>

            ${questions([
                [
                    "В 1829 году Пушкин путешествовал по ______.",
                    "В 1829 году Пушкин путешествовал по " +
                    red("Кавказу") + "."
                ],
                [
                    "Монастырь сравнивается с ______.",
                    "Монастырь сравнивается с " +
                    red("ковчегом") + "."
                ],
                [
                    "Монастырь расположен за ______.",
                    "Монастырь расположен за " +
                    red("облаками") + "."
                ],
                [
                    "Лирический герой стремится к духовной ______.",
                    "Лирический герой стремится к духовной " +
                    red("свободе") + "."
                ]
            ])}
        `
    },

    // ======================================
    // 12. УПРАЖНЕНИЕ №3 — 5 МИНУТ
    // ======================================

    {
        menu: "✍ Упр. 3. Литературные приёмы",
        time: 5,
        label: "ПИСЬМЕННАЯ РАБОТА",
        type: "exercise",

        html: `
            <h1>Определите художественные средства</h1>

            ${exercise(
                3,
                "Эпитет, сравнение или метафора?",
                "Перепишите выражения в тетрадь. " +
                "Рядом укажите название художественного " +
                "приёма и кратко объясните его значение.",

                "Золотая осень — " +
                blue("эпитет") +
                ". Образное определение осени."
            )}

            ${questions([
                [
                    "«Царственный шатер».",

                    blue("Эпитет") +
                    " — подчёркивает величие."
                ],
                [
                    "«Семьею гор».",

                    blue("Метафора") +
                    " — горы образно названы семьёй."
                ],
                [
                    "«Как в небе реющий ковчег».",

                    blue("Сравнение") +
                    " — монастырь сравнивается с ковчегом."
                ],
                [
                    "«Вольная вышина».",

                    blue("Эпитет") +
                    " — передаёт представление о свободе."
                ]
            ])}
        `
    },

    // ======================================
    // 13. УПРАЖНЕНИЕ №4 — 5 МИНУТ
    // ======================================

    {
        menu: "✍ Упр. 4. Грамматика",
        time: 5,
        label: "ПИСЬМЕННАЯ РАБОТА",
        type: "exercise",

        html: `
            <h1>Грамматический разбор</h1>

            ${exercise(
                4,
                "Разберите предложение",
                "Перепишите предложение. " +
                "Выпишите существительные, " +
                "прилагательные и глагол. " +
                "Подчеркните грамматическую основу.",

                "Красивый — какой? — " +
                blue("имя прилагательное") + "."
            )}

            <div class="rule">

                Высокие горы сияют
                яркими лучами солнца.

            </div>

            ${questions([
                [
                    "Выпишите существительные.",
                    blue("Горы, лучами, солнца.")
                ],
                [
                    "Выпишите прилагательные.",
                    blue("Высокие, яркими.")
                ],
                [
                    "Выпишите глагол и поставьте вопрос.",
                    blue("Сияют") + " — что делают?"
                ],
                [
                    "Определите грамматическую основу.",
                    red("Горы сияют.") +
                    "<br>Горы — подлежащее.<br>" +
                    "Сияют — сказуемое."
                ]
            ])}
        `
    },

    // ======================================
    // 14. УПРАЖНЕНИЕ №5 — 5 МИНУТ
    // ======================================

    {
        menu: "✍ Упр. 5. Словарная работа",
        time: 5,
        label: "ПИСЬМЕННАЯ РАБОТА",
        type: "exercise",

        html: `
            <h1>Работа со словами</h1>

            ${exercise(
                5,
                "Объясните значение слов",
                "Запишите каждое слово и его значение. " +
                "После этого составьте одно предложение " +
                "с любым современным словом из ответов.",

                "Вышина — " +
                blue("высота") + "."
            )}

            ${questions([
                [
                    red("Брег"),
                    "Берег."
                ],
                [
                    red("Келья"),
                    "Небольшое помещение для монаха."
                ],
                [
                    red("Вожделенный"),
                    "Сильно желанный."
                ],
                [
                    red("Реющий"),
                    "Парящий в воздухе."
                ],
                [
                    "Составьте предложение со словом «берег».",
                    "Мы остановились на берегу горной реки."
                ]
            ])}
        `
    },

    // ======================================
    // 15. УПРАЖНЕНИЕ №6 — 5 МИНУТ
    // ======================================

    {
        menu: "✍ Упр. 6. Мини-сочинение",
        time: 5,
        label: "ПИСЬМЕННАЯ ТВОРЧЕСКАЯ РАБОТА",
        type: "exercise",

        html: `
            <h1>Мини-сочинение</h1>

            ${exercise(
                6,
                "Выразите собственное мнение",
                "Напишите в тетради 5–7 предложений. " +
                "Используйте изученное стихотворение " +
                "и собственные мысли.",

                "Я считаю, что природа помогает " +
                "человеку задуматься о жизни."
            )}

            <h2 class="red">
                «Красота природы и внутренний мир человека»
            </h2>

            <div class="rule">

                <b>План мини-сочинения:</b>

                <ol>

                    <li>
                        Что чувствует человек,
                        когда любуется природой?
                    </li>

                    <li>
                        Какую природу описывает Пушкин?
                    </li>

                    <li>
                        Как природа связана с чувствами героя?
                    </li>

                    <li>
                        Сделайте собственный вывод.
                    </li>

                </ol>

            </div>

            ${answer(
                "Пример сочинения:<br><br>" +
                "Природа помогает человеку обрести спокойствие. " +
                "Горные пейзажи вызывают восхищение. " +
                "В стихотворении Пушкина описываются величественные горы. " +
                "Лирический герой мечтает о духовной свободе. " +
                "Природа помогает понять его чувства. " +
                "Я считаю, что красота окружающего мира " +
                "заставляет человека задуматься о жизни."
            )}

            <p class="green">
                Допускаются другие самостоятельные сочинения.
            </p>
        `
    },

    // ======================================
    // 16. ВИКТОРИНА — 4 МИНУТЫ
    // ======================================

    {
        menu: "🎯 Викторина",
        time: 4,
        label: "ПРОВЕРЯЕМ ЗНАНИЯ",
        type: "quiz"
    },

    // ======================================
    // 17. ГРУППОВАЯ ИГРА — 10 МИНУТ
    // ======================================

    {
        menu: "🏆 Литературная битва",
        time: 10,
        label: "ГРУППОВАЯ РАБОТА",
        type: "game"
    },

    // ======================================
    // 18. ИТОГИ — 1 МИНУТА
    // ======================================

    {
        menu: "📊 Итоги урока",
        time: 1,
        label: "ПОДВЕДЕНИЕ ИТОГОВ",
        type: "results"
    },

    // ======================================
    // 19. ДОМАШНЕЕ ЗАДАНИЕ — 1 МИНУТА
    // ======================================

    {
        menu: "🏠 Домашнее задание",
        time: 1,
        label: "ЗАПИШИТЕ ДОМАШНЕЕ ЗАДАНИЕ",
        type: "homework",

        html: `
            <h1>Домашнее задание</h1>

            <div class="homework-title">

                § 1.1.1.
                А. С. Пушкин.
                «Монастырь на Казбеке»

            </div>

            <div class="homework">

                <div class="exercise-heading">

                    <span class="exercise-number">1</span>

                    Письменная работа

                </div>

                <p>

                    Составьте в тетради
                    ${red("5 вопросов")}
                    по стихотворению
                    «Монастырь на Казбеке».

                </p>

                <p>

                    Под каждым вопросом
                    напишите полный ответ.

                </p>

            </div>

            <div class="homework">

                <div class="exercise-heading">

                    <span class="exercise-number">2</span>

                    Сочинение-описание

                </div>

                <h2>
                    «Моё любимое место на природе»
                </h2>

                <p>

                    Напишите сочинение объёмом
                    ${red("80–100 слов")}.

                </p>

                <b class="blue">Требования:</b>

                <ol>

                    <li>
                        Опишите любимое природное место.
                    </li>

                    <li>
                        Используйте не менее двух эпитетов
                        и одного сравнения.
                    </li>

                    <li>
                        Расскажите, какие чувства
                        вызывает у вас это место.
                    </li>

                </ol>

            </div>

            <div class="note">

                Оба задания выполнить
                ${red("письменно в тетради")}.

            </div>

            <div class="farewell">

                <h1 class="green">
                    Спасибо за урок!
                </h1>

                <p>
                    До следующей встречи!
                </p>

                <strong class="gold">
                    BY DARKHAN
                </strong>

            </div>
        `
    }

];

// ==========================================
// 7. ВИКТОРИНА
// ==========================================

const quizQuestions = [

    {
        q: "Кто написал «Монастырь на Казбеке»?",
        options: [
            "М. Ю. Лермонтов",
            "А. С. Пушкин",
            "Н. В. Гоголь",
            "А. П. Чехов"
        ],
        correct: 1,
        explanation: "Автор — Александр Сергеевич Пушкин."
    },

    {
        q: "В каком году создано стихотворение?",
        options: ["1829", "1812", "1850", "1837"],
        correct: 0,
        explanation: "Произведение создано в 1829 году."
    },

    {
        q: "Где находится Казбек?",
        options: [
            "На Урале",
            "В Сибири",
            "На Кавказе",
            "В Карпатах"
        ],
        correct: 2,
        explanation: "Казбек — горная вершина Кавказа."
    },

    {
        q: "Что означает слово «брег»?",
        options: [
            "Храм",
            "Вершина",
            "Облако",
            "Берег"
        ],
        correct: 3,
        explanation: "Брег — устаревшее слово «берег»."
    },

    {
        q: "Какой приём использован в выражении «семьею гор»?",
        options: [
            "Метафора",
            "Сравнение",
            "Повтор",
            "Диалог"
        ],
        correct: 0,
        explanation: "Горы образно представлены как семья."
    },

    {
        q: "С чем сравнивается монастырь?",
        options: [
            "С деревом",
            "С ковчегом",
            "С рекой",
            "С городом"
        ],
        correct: 1,
        explanation: "Монастырь сравнивается с ковчегом."
    },

    {
        q: "Что может символизировать высота?",
        options: [
            "Богатство",
            "Известность",
            "Духовное возвышение",
            "Усталость"
        ],
        correct: 2,
        explanation: "Высота связана со стремлением к свободе."
    },

    {
        q: "К чему стремится лирический герой?",
        options: [
            "К славе",
            "К богатству",
            "К власти",
            "К духовной свободе"
        ],
        correct: 3,
        explanation: "Герой мечтает о духовной свободе и уединении."
    }

];

const letters = ["А", "Б", "В", "Г"];

const quiz = {
    index: 0,
    score: 0,
    selected: null,
    revealed: false
};

function quizChecked() {
    return quiz.selected !== null || quiz.revealed;
}

function resetQuiz() {

    Object.assign(quiz, {
        index: 0,
        score: 0,
        selected: null,
        revealed: false
    });

    renderPage();
    scrollTop();
}

function renderQuiz() {

    if (quiz.index >= quizQuestions.length) {

        return `
            <div class="result">

                <h1>Викторина завершена!</h1>

                <div class="big-score">
                    ${quiz.score} / ${quizQuestions.length}
                </div>

                <p>Правильных ответов</p>

            </div>
        `;
    }

    const q = quizQuestions[quiz.index];

    return `
        <h1>Литературная викторина</h1>

        <div class="instruction">
            Назовите правильный вариант ответа.
            Преподаватель выбирает его
            на левой панели управления.
        </div>

        <p class="blue">
            Вопрос ${quiz.index + 1}
            из ${quizQuestions.length}
        </p>

        <h2>${q.q}</h2>

        <div class="options">

            ${q.options.map((text, index) => {

                let css = "option";

                if (quizChecked()) {
                    if (index === q.correct) {
                        css += " correct";
                    } else if (index === quiz.selected) {
                        css += " wrong";
                    }
                }

                return `
                    <div class="${css}">
                        ${letters[index]}. ${text}
                    </div>
                `;

            }).join("")}

        </div>

        ${answer(
            q.options[q.correct] +
            "<br>" + q.explanation,

            quizChecked(),

            "if(this.open && this.isConnected) revealQuiz()"
        )}

        ${quiz.selected !== null ? `
            <p>
                ${quiz.selected === q.correct
                    ? green("Правильно! +1 балл")
                    : red("Неправильный ответ")}
            </p>
        ` : ""}

        ${quiz.revealed && quiz.selected === null ? `
            <p class="gold">
                Ответ показан без начисления балла.
            </p>
        ` : ""}

        <p class="green">
            Правильных ответов: ${quiz.score}
        </p>
    `;
}

function chooseQuiz(index) {

    if (quizChecked()) return;

    const q = quizQuestions[quiz.index];

    if (!q || !q.options[index]) return;

    quiz.selected = index;

    if (index === q.correct) {
        quiz.score++;
    }

    renderPage();
}

function revealQuiz() {

    if (pages[currentPage].type !== "quiz") return;

    if (quizChecked()) return;

    quiz.revealed = true;

    renderPage();
}

function nextQuiz() {

    if (!quizChecked()) return;

    quiz.index++;
    quiz.selected = null;
    quiz.revealed = false;

    renderPage();
    scrollTop();
}

// ==========================================
// 8. ГРУППОВАЯ ИГРА
// ПЯТЬ РАУНДОВ
// ==========================================

const rounds = [

    {
        name: "Верно или неверно",
        points: 10,

        instruction:
            "Определите, верно ли утверждение. " +
            "Запишите ответ в тетрадь. " +
            "Если неверно — исправьте ошибку.",

        tasks: [
            {
                q: "Стихотворение написано в 1829 году.",

                a: "Верно."
            },
            {
                q: "Пушкин родился в Санкт-Петербурге.",

                a: "Неверно. Пушкин родился в Москве."
            }
        ]
    },

    {
        name: "Лишнее слово",
        points: 20,

        instruction:
            "Найдите лишнее слово. " +
            "Запишите его и объясните свой выбор.",

        tasks: [
            {
                q: "Горы, ущелье, облака, мегаполис.",

                a: "Мегаполис. Остальные слова связаны с горным пейзажем."
            },
            {
                q: "Эпитет, метафора, сравнение, подлежащее.",

                a: "Подлежащее. Это главный член предложения."
            }
        ]
    },

    {
        name: "Восстановите строки",
        points: 30,

        instruction:
            "Запишите в тетради пропущенные слова.",

        tasks: [
            {
                q:
                    "Твой монастырь за ________,<br>" +
                    "Как в небе реющий ________,",

                a: red("Облаками, ковчег.")
            },
            {
                q:
                    "Подняться к вольной ________!<br>" +
                    "Туда б, в заоблачную ________,",

                a: red("Вышине, келью.")
            }
        ]
    },

    {
        name: "Литературный детектив",
        points: 40,

        instruction:
            "Запишите названия двух художественных приёмов.",

        tasks: [
            {
                q:
                    "1. Царственный шатер.<br>" +
                    "2. Семьею гор.",

                a:
                    blue("1. Эпитет.") + "<br>" +
                    blue("2. Метафора.")
            },
            {
                q:
                    "1. Как в небе реющий ковчег.<br>" +
                    "2. Вольная вышина.",

                a:
                    blue("1. Сравнение.") + "<br>" +
                    blue("2. Эпитет.")
            }
        ]
    },

    {
        name: "Главная мысль",
        points: 50,

        instruction:
            "Обсудите вопрос и запишите " +
            "короткий обоснованный ответ.",

        tasks: [
            {
                q:
                    "Почему герой мечтает " +
                    "подняться к монастырю?",

                a:
                    "Монастырь воспринимается как место " +
                    "духовного уединения. " +
                    "Герой стремится к свободе и покою."
            },
            {
                q:
                    "Почему описание природы важно " +
                    "для понимания стихотворения?",

                a:
                    "Природа помогает раскрыть чувства " +
                    "и желания героя, его восхищение " +
                    "красотой мира и стремление к свободе."
            }
        ]
    }

];

const TOTAL_TASKS = rounds.length * 2;

const game = {
    started: false,
    finished: false,
    mode: null,
    index: 0,
    scores: [0, 0],
    revealed: false,
    marked: null
};

function resetGameState() {

    Object.assign(game, {
        started: false,
        finished: false,
        mode: null,
        index: 0,
        scores: [0, 0],
        revealed: false,
        marked: null
    });
}

function startGame(mode) {

    if (settings.count === 0) {
        notify("Укажите количество учеников.");
        return;
    }

    if (mode === "team" && settings.count < 4) {
        notify("Выберите самостоятельную работу.");
        return;
    }

    resetGameState();

    game.started = true;
    game.mode = mode;

    renderPage();
    scrollTop();
}

function currentRound() {
    return rounds[Math.floor(game.index / 2)];
}

function currentTeam() {
    return game.index % 2;
}

function scoreboard(active = true) {

    const counts = [
        Math.ceil(settings.count / 2),
        Math.floor(settings.count / 2)
    ];

    return `
        <div class="scoreboard">

            ${game.scores.map((score, index) => `

                <div class="team
                    ${index === 1 ? "second" : ""}
                    ${active && currentTeam() === index
                        ? "active" : ""}">

                    КОМАНДА №${index + 1}

                    <small>
                        ${counts[index]} участников
                    </small>

                    <strong>${score}</strong>

                    <small>
                        ${!active
                            ? "ИТОГОВЫЕ БАЛЛЫ"
                            : currentTeam() === index
                                ? "СЕЙЧАС ОТВЕЧАЕТ"
                                : "ОЖИДАЕТ"}
                    </small>

                </div>

            `).join("")}

        </div>
    `;
}

function renderGame() {

    if (!game.started) {

        return `
            <h1>Литературная битва</h1>

            <div class="rule">

                <p>
                    Присутствуют:
                    ${green(settings.count)}
                </p>

                <p>
                    Рекомендуемый режим:

                    ${red(
                        settings.count === 0
                            ? "Нет учеников"
                            : recommendedMode() === "team"
                                ? "Групповая игра"
                                : "Самостоятельная работа"
                    )}
                </p>

            </div>

            <h2>Правила игры</h2>

            <ol>

                <li>
                    Разделитесь на две команды.
                </li>

                <li>
                    Все ученики остаются на своих местах.
                </li>

                <li>
                    Обсудите задание внутри команды.
                </li>

                <li>
                    Запишите ответ в тетради.
                </li>

                <li>
                    Один представитель команды
                    читает ответ со своего места.
                </li>

                <li>
                    Преподаватель начисляет баллы.
                </li>

            </ol>

            ${table(
                ["Раунд", "Название", "Баллы"],
                rounds.map((round, i) => [
                    i + 1,
                    blue(round.name),
                    red(round.points)
                ])
            )}

            <div class="note">
                10 заданий — 5 раундов.
                Максимум каждой команды — 150 баллов.
            </div>
        `;
    }

    if (game.mode === "individual") {
        return renderIndividual();
    }

    if (game.finished || game.index >= TOTAL_TASKS) {
        return renderWinner();
    }

    const round = currentRound();
    const task = round.tasks[currentTeam()];
    const roundIndex = Math.floor(game.index / 2);

    return `
        <h1>Литературная битва</h1>

        <div class="rounds">

            ${rounds.map((r, index) => `

                <div class="round
                    ${index === roundIndex ? "active" : ""}
                    ${index < roundIndex ? "done" : ""}">

                    Раунд ${index + 1}

                </div>

            `).join("")}

        </div>

        ${scoreboard()}

        <p class="red">
            Раунд ${roundIndex + 1} — ${round.name}
        </p>

        <p class="gold">${round.points} баллов</p>

        <div class="instruction">
            ${round.instruction}
        </div>

        <div class="question">

            <h2>${task.q}</h2>

            ${answer(
                task.a,
                game.revealed,
                "if(this.open && this.isConnected) revealGame()"
            )}

            ${game.marked !== null ? `
                <p>
                    ${game.marked
                        ? green("Правильно! +" + round.points)
                        : red("Неправильно. 0 баллов.")}
                </p>
            ` : ""}

        </div>

        <p class="blue">
            Задание ${game.index + 1} из ${TOTAL_TASKS}
        </p>
    `;
}

function revealGame() {

    if (
        pages[currentPage].type !== "game" ||
        game.mode !== "team" ||
        game.finished ||
        game.revealed
    ) return;

    game.revealed = true;

    renderGameControls();
}

function markGame(correct) {

    if (
        !game.started ||
        game.mode !== "team" ||
        game.finished ||
        !game.revealed ||
        game.marked !== null
    ) return;

    const round = currentRound();

    if (!round) return;

    game.marked = correct;

    if (correct) {
        game.scores[currentTeam()] += round.points;
    }

    renderPage();
}

function nextGame() {

    if (game.finished || game.marked === null) return;

    game.index++;
    game.revealed = false;
    game.marked = null;

    if (game.index >= TOTAL_TASKS) {
        game.finished = true;
    }

    renderPage();
    scrollTop();
}

function finishGame() {

    const completed =
        game.index + (game.marked !== null ? 1 : 0);

    if (completed % 2 !== 0) {
        notify("Сначала завершите задания обеих команд.");
        return;
    }

    if (!confirm("Завершить игру?")) return;

    game.finished = true;

    renderPage();
    scrollTop();
}

function restartGame() {

    if (game.started && game.mode === "team") {
        if (!confirm("Обнулить результаты игры?")) return;
    }

    resetGameState();

    renderPage();
    scrollTop();
}

function renderWinner() {

    let title = "Ничья!";

    if (game.scores[0] > game.scores[1]) {
        title = "Победила команда №1!";
    } else if (game.scores[1] > game.scores[0]) {
        title = "Победила команда №2!";
    }

    return `
        <div class="result">

            <div style="font-size:80px">🏆</div>

            <h1>${title}</h1>

            ${scoreboard(false)}

            <p class="green">
                Спасибо всем за участие!
            </p>

        </div>
    `;
}

// ==========================================
// 9. САМОСТОЯТЕЛЬНАЯ РАБОТА
// ЕСЛИ УЧЕНИКОВ МАЛО
// ==========================================

function renderIndividual() {

    return `
        <h1>Самостоятельная работа</h1>

        <p class="writing-label">
            ✍ ВЫПОЛНИТЕ В ТЕТРАДИ · 10 МИНУТ
        </p>

        <div class="instruction">

            Запишите номера заданий
            и самостоятельно выполните их.
            После выполнения проверьте ответы.

        </div>

        ${questions([
            [
                "Запишите название произведения, автора и год создания.",
                "«Монастырь на Казбеке». А. С. Пушкин. 1829 год."
            ],
            [
                "Сформулируйте тему стихотворения.",
                "Красота природы Кавказа и стремление к духовной свободе."
            ],
            [
                "Объясните значение слов «брег» и «келья».",
                "Брег — берег. Келья — помещение для монаха."
            ],
            [
                "Выпишите два эпитета из стихотворения.",
                "Царственный шатер, вольная вышина."
            ],
            [
                "Составьте предложение с одним сравнением.",
                "Снежные вершины сияют, словно серебро."
            ],
            [
                "Напишите 2–3 предложения о главной мысли стихотворения.",
                "Герой стремится к духовному покою. " +
                "Величественная природа помогает раскрыть его чувства."
            ]
        ])}
    `;
}

// ==========================================
// 10. ИТОГИ УРОКА
// ==========================================

function renderResults() {

    const completed = Math.min(
        quizQuestions.length,
        quiz.index + (quizChecked() ? 1 : 0)
    );

    const rows = [

        ["Присутствуют", settings.count],

        [
            "Письменные упражнения по плану",
            "6 упражнений"
        ],

        [
            "Пройдено вопросов викторины",
            completed + " / " + quizQuestions.length
        ],

        [
            "Правильных ответов",
            green(quiz.score)
        ]

    ];

    if (game.mode === "team") {

        rows.push(
            ["Команда №1", blue(game.scores[0] + " баллов")],
            ["Команда №2", game.scores[1] + " баллов"]
        );

    }

    if (game.mode === "individual") {

        rows.push([
            "Режим работы",
            "Самостоятельная работа"
        ]);

    }

    return `
        <h1>Итоги урока</h1>

        ${table(["Показатель", "Результат"], rows)}

        <h2>Сегодня мы изучили</h2>

        <div class="conclusion">

            <p>✓ Содержание стихотворения.</p>
            <p>✓ Тему и основную идею.</p>
            <p>✓ Эпитет, сравнение и метафору.</p>
            <p>✓ Письменный анализ текста.</p>

        </div>

        <div class="note">

            Проверьте записи в тетради.

            На следующей странице —
            домашнее задание.

        </div>
    `;
}

// ==========================================
// 11. КНОПКИ НА ЛЕВОЙ ПАНЕЛИ
// ==========================================

function btn(text, action, disabled = false, css = "") {

    return `
        <button class="${css}"
                onclick="${action}"
                ${disabled ? "disabled" : ""}>
            ${text}
        </button>
    `;
}

function setActions(html = "") {

    $("actions").innerHTML = html
        ? `<div class="label">ДЕЙСТВИЯ</div>${html}`
        : "";
}

function renderQuizControls() {

    if (quiz.index >= quizQuestions.length) {

        setActions(
            btn("Пройти заново", "resetQuiz()") +
            btn("Перейти к игре →", "move(1)")
        );

        return;
    }

    const q = quizQuestions[quiz.index];

    setActions(

        q.options.map((text, index) =>

            btn(
                letters[index] + ". " + text,

                `chooseQuiz(${index})`,

                quizChecked(),

                quizChecked() && index === q.correct
                    ? "good"
                    : quizChecked() && index === quiz.selected
                        ? "bad"
                        : ""
            )

        ).join("") +

        btn(
            "Следующий вопрос →",
            "nextQuiz()",
            !quizChecked()
        )

    );
}

function renderGameControls() {

    if (!game.started) {

        setActions(

            btn(
                "Количество учеников",
                "openSettings()"
            ) +

            btn(
                "Начать выбранный режим",
                "startGame(recommendedMode())",
                settings.count === 0
            ) +

            btn(
                "🏆 Групповая игра",
                "startGame('team')",
                settings.count < 4
            ) +

            btn(
                "✍ Самостоятельная работа",
                "startGame('individual')",
                settings.count === 0
            )

        );

        return;
    }

    if (game.mode === "individual") {

        setActions(

            btn(
                "Показать все ответы",
                "showAnswers(true)"
            ) +

            btn(
                "Скрыть ответы",
                "showAnswers(false)"
            ) +

            btn(
                "Выбрать другой режим",
                "restartGame()"
            ) +

            btn("Итоги урока →", "move(1)")

        );

        return;
    }

    if (game.finished || game.index >= TOTAL_TASKS) {

        setActions(

            btn("Играть заново", "restartGame()") +

            btn("Итоги урока →", "move(1)")

        );

        return;
    }

    const round = currentRound();

    setActions(

        btn(
            "✓ Правильно +" + round.points,
            "markGame(true)",
            !game.revealed || game.marked !== null,
            "good"
        ) +

        btn(
            "✕ Неправильно",
            "markGame(false)",
            !game.revealed || game.marked !== null,
            "bad"
        ) +

        btn(
            "Следующее задание →",
            "nextGame()",
            game.marked === null
        ) +

        btn("Завершить игру", "finishGame()") +

        btn("Начать заново", "restartGame()")

    );
}

function renderControls(page) {

    switch (page.type) {

        case "start":

            setActions(
                btn("▶ Начать урок", "startLesson()")
            );

            break;

        case "reading":

            setActions(

                btn(
                    "🔊 Прослушать стихотворение",
                    "readPoem()"
                ) +

                btn(
                    "■ Остановить чтение",
                    "stopReading()"
                )

            );

            break;

        case "exercise":

            setActions(

                btn(
                    "Показать все ответы",
                    "showAnswers(true)"
                ) +

                btn(
                    "Скрыть все ответы",
                    "showAnswers(false)"
                )

            );

            break;

        case "quiz":

            renderQuizControls();

            break;

        case "game":

            renderGameControls();

            break;

        case "results":

            setActions(

                btn(
                    "Домашнее задание →",
                    "move(1)"
                ) +

                btn(
                    "Распечатать итоги",
                    "window.print()"
                )

            );

            break;

        case "homework":

            setActions(

                btn(
                    "Распечатать домашнее задание",
                    "window.print()"
                ) +

                btn(
                    "Завершить урок",
                    "finishLesson()"
                ) +

                btn(
                    "Вернуться на главную",
                    "goTo(0)"
                )

            );

            break;

        default:

            setActions();

    }
}

// ==========================================
// 12. НАВИГАЦИЯ
// ==========================================

let currentPage = 0;

function renderPage() {

    const page = pages[currentPage];

    if (!page) return;

    let html = page.html || "";

    if (page.type === "quiz") {
        html = renderQuiz();
    } else if (page.type === "game") {
        html = renderGame();
    } else if (page.type === "results") {
        html = renderResults();
    }

    $("page").innerHTML = `
        <div class="page-heading">

            <span>${page.label}</span>

            <span class="page-time">
                ◷ ${page.time} мин
            </span>

        </div>

        ${html}
    `;

    $("navigation").innerHTML = pages.map(

        (item, index) => `

            <button
                class="nav-btn
                    ${index === currentPage ? "active" : ""}"

                onclick="goTo(${index})">

                ${item.menu}

            </button>

        `

    ).join("");

    $("pageNumber").textContent =
        `${currentPage + 1} / ${pages.length}`;

    $("progress").style.width =
        ((currentPage + 1) / pages.length * 100) + "%";

    $("prev").disabled = currentPage === 0;

    $("next").disabled =
        currentPage === pages.length - 1;

    renderControls(page);
}

function scrollTop() {
    $("bookArea").scrollTop = 0;
    $("bookArea").scrollLeft = 0;
}

function goTo(index) {

    if (index < 0 || index >= pages.length) return;

    stopReading();

    currentPage = index;

    renderPage();
    scrollTop();

    if (window.innerWidth <= 800) {
        document.body.classList.add("menu-hidden");
    }
}

function move(amount) {
    goTo(currentPage + amount);
}

function startLesson() {

    if (!running) {
        toggleTimer();
    }

    goTo(1);
}

function finishLesson() {

    if (running) {
        toggleTimer();
    }

    stopReading();

    notify("Урок завершён. Спасибо за участие!");
}

// ==========================================
// 13. ТАЙМЕР УРОКА
// ==========================================

let remaining = LESSON_MINUTES * 60;
let running = false;
let deadline = 0;
let timerInterval = null;

function updateTimer() {

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    $("timer").textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");

    $("timer").style.color =
        remaining <= 300
            ? "#ff9696"
            : "#ffda9c";
}

function tick() {

    if (!running) return;

    remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
    );

    updateTimer();

    if (remaining === 0) {

        running = false;

        clearInterval(timerInterval);

        $("timerButton").textContent = "Старт";

        notify("80 минут истекли. Время урока завершилось.");
    }
}

function toggleTimer() {

    if (running) {

        tick();

        running = false;

        clearInterval(timerInterval);

        $("timerButton").textContent = "Старт";

        return;
    }

    if (remaining === 0) {
        remaining = LESSON_MINUTES * 60;
    }

    deadline = Date.now() + remaining * 1000;

    running = true;

    $("timerButton").textContent = "Пауза";

    timerInterval = setInterval(tick, 250);

    updateTimer();
}

function resetTimer() {

    clearInterval(timerInterval);

    running = false;
    remaining = LESSON_MINUTES * 60;

    $("timerButton").textContent = "Старт";

    updateTimer();
}

// ==========================================
// 14. ЧАСЫ АЛМАТЫ — UTC+5
// ==========================================

function updateClock() {

    const now = new Date(
        Date.now() + 5 * 60 * 60 * 1000
    );

    const hours = String(
        now.getUTCHours()
    ).padStart(2, "0");

    const minutes = String(
        now.getUTCMinutes()
    ).padStart(2, "0");

    const seconds = String(
        now.getUTCSeconds()
    ).padStart(2, "0");

    $("clock").textContent =
        `${hours}:${minutes}:${seconds}`;

    $("date").textContent =
        new Intl.DateTimeFormat("ru-RU", {
            timeZone: "UTC",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(now);
}

// ==========================================
// 15. МАСШТАБ ЭКРАНА
// ==========================================

let zoom = Number(
    load("rus111-notebook-zoom", 100)
);

if (!Number.isFinite(zoom)) zoom = 100;

zoom = Math.max(50, Math.min(200, zoom));

function applyZoom() {

    document.documentElement.style.setProperty(
        "--zoom",
        zoom / 100
    );

    $("zoomValue").textContent = zoom + "%";

    save("rus111-notebook-zoom", zoom);
}

function changeZoom(amount) {

    zoom = Math.max(
        50,
        Math.min(200, zoom + amount)
    );

    applyZoom();
}

function resetZoom() {
    zoom = 100;
    applyZoom();
}

// ==========================================
// 16. ПОЛНОЭКРАННЫЙ РЕЖИМ
// ==========================================

function toggleMenu() {
    document.body.classList.toggle("menu-hidden");
}

async function fullscreen() {

    try {

        if (!document.fullscreenElement) {

            if (!document.documentElement.requestFullscreen) {
                notify("Используйте клавишу F11.");
                return;
            }

            await document.documentElement.requestFullscreen();

        } else {

            await document.exitFullscreen();

        }

    } catch {

        notify("Полноэкранный режим недоступен.");

    }
}

// ==========================================
// 17. ОЗВУЧИВАНИЕ СТИХОТВОРЕНИЯ
// ==========================================

function readPoem() {

    if (!("speechSynthesis" in window)) {
        notify("Озвучивание недоступно.");
        return;
    }

    stopReading();

    const speech = new SpeechSynthesisUtterance(poem);

    speech.lang = "ru-RU";
    speech.rate = 0.85;

    const voice = speechSynthesis.getVoices()
        .find(item => item.lang.startsWith("ru"));

    if (voice) {
        speech.voice = voice;
    }

    speech.onerror = event => {

        if (!["interrupted", "canceled"].includes(event.error)) {
            notify("Русская озвучка недоступна.");
        }
    };

    speechSynthesis.speak(speech);
}

function stopReading() {

    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }
}

// ==========================================
// 18. УВЕДОМЛЕНИЯ
// ==========================================

let notificationTimeout;

function notify(text) {

    clearTimeout(notificationTimeout);

    $("notification").textContent = text;

    $("notification").style.display = "block";

    notificationTimeout = setTimeout(() => {

        $("notification").style.display = "none";

    }, 4000);
}

// ==========================================
// 19. УПРАВЛЕНИЕ КЛАВИАТУРОЙ
// ==========================================

document.addEventListener("keydown", event => {

    if (
        $("settingsDialog").open ||
        $("photoDialog").open
    ) return;

    if (
        ["INPUT", "SELECT", "TEXTAREA", "SUMMARY", "BUTTON"]
            .includes(event.target.tagName)
    ) return;

    if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
    }

    if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(10);
    }

    if (event.key === "-") {
        event.preventDefault();
        changeZoom(-10);
    }

    if (event.key === "0") {
        resetZoom();
    }

    if (event.key.toLowerCase() === "f") {
        fullscreen();
    }

    if (event.key.toLowerCase() === "m") {
        toggleMenu();
    }
});

// ==========================================
// 20. ЗАПУСК САЙТА
// ==========================================

if (window.innerWidth <= 800) {
    document.body.classList.add("menu-hidden");
}

renderPage();

updateAttendance();

updateClock();

updateTimer();

applyZoom();

setInterval(updateClock, 1000);

console.log("Электронный учебник запущен.");

console.log("Количество страниц:", pages.length);

console.log(
    "Продолжительность урока:",
    pages.reduce((sum, page) => sum + page.time, 0),
    "минут"
);

// ==========================================
// BY DARKHAN
// ==========================================
