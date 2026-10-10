// 获取全局元素
const pagesContainer = document.getElementById('pages-container');
const characterInput = document.getElementById('character-input');
const fontSizeSelect = document.getElementById('font-size-select');
const traceCountSelect = document.getElementById('trace-count-select');
const gridTypeSelect = document.getElementById('grid-type-select');
const strokeStripToggle = document.getElementById('stroke-strip-toggle');

var { pinyin } = pinyinPro;

let ROWS_PER_PAGE = 11; // 每页行数（初始化时按正方形字格自动计算）
const COLS_PER_PAGE = 11; // 每页列数
const GRID_GAP = 2; // 网格间距（与 style.css 保持一致）
let CELL_UNIT_H = 0; // 单个字格高度（px），0 表示使用 CSS 默认值
const STRIP_COLS = 3; // 笔顺拆解栏占用格数（保持 3：窄到 2 列时笔画多的字会看不全，靠横向滚动兜底）

// 创建单个田字格
function createCell() {
    const cell = document.createElement('div');
    cell.classList.add('cell');

    // 添加拼音横线区域
    const pinyinLines = document.createElement('div');
    pinyinLines.classList.add('pinyin-lines');

    // 添加四线格
    const fourLines = document.createElement('div');
    fourLines.classList.add('four-lines');
    for (let i = 0; i < 4; i++) {
        const line = document.createElement('div');
        line.classList.add('line');
        fourLines.appendChild(line);
    }
    pinyinLines.appendChild(fourLines);

    // 添加拼音文本容器
    const pinyinText = document.createElement('div');
    pinyinText.classList.add('pinyin-text');
    pinyinLines.appendChild(pinyinText);

    cell.appendChild(pinyinLines);

    // 添加米字格斜线容器（默认隐藏，切换为米字格时显示）
    const diagonals = document.createElement('div');
    diagonals.classList.add('diagonals');
    cell.appendChild(diagonals);

    return cell;
}

// 构建页眉（标题 + 姓名/日期栏，内容跨页同步）
function buildPageHeader() {
    const header = document.createElement('div');
    header.classList.add('page-header');

    // 标题
    const title = document.createElement('div');
    title.classList.add('page-title');
    title.contentEditable = 'true';
    title.spellcheck = false;
    title.textContent = '汉字练字帖';
    header.appendChild(title);

    // 姓名日期栏
    const meta = document.createElement('div');
    meta.classList.add('page-meta');

    const nameLabel = document.createElement('span');
    nameLabel.textContent = '姓名：';
    const nameField = document.createElement('span');
    nameField.classList.add('meta-field', 'name-field');
    nameField.contentEditable = 'true';
    nameField.spellcheck = false;
    meta.appendChild(nameLabel);
    meta.appendChild(nameField);

    const dateLabel = document.createElement('span');
    dateLabel.textContent = '日期：';
    const dateField = document.createElement('span');
    dateField.classList.add('meta-field', 'date-field');
    dateField.contentEditable = 'true';
    dateField.spellcheck = false;
    meta.appendChild(dateLabel);
    meta.appendChild(dateField);

    header.appendChild(meta);
    return header;
}

// 将基准页眉的内容同步到所有页（不传 source 时以第一页为基准）
function syncHeaders(source) {
    const pages = Array.from(pagesContainer.children);
    if (pages.length === 0) {
        return;
    }
    const src = source || pages[0].querySelector('.page-header');
    if (!src) {
        return;
    }
    pages.forEach(page => {
        const header = page.querySelector('.page-header');
        if (!header || header === src) {
            return;
        }
        header.querySelector('.page-title').textContent = src.querySelector('.page-title').textContent;
        header.querySelector('.name-field').textContent = src.querySelector('.name-field').textContent;
        header.querySelector('.date-field').textContent = src.querySelector('.date-field').textContent;
    });
}

// 按正方形字格计算每页行数：
// 写字区（占单元格 65%）为正方形 → 单元格高 = 列宽 / 0.65，
// 与市面拼音田字格练习本比例一致（方形田字格 + 上方四线格）
function computeRowsPerPage() {
    // 用临时页测量真实布局尺寸
    const probe = document.createElement('div');
    probe.classList.add('a4-page');
    probe.appendChild(buildPageHeader());
    const grid = document.createElement('div');
    grid.classList.add('grid-container');
    probe.appendChild(grid);
    pagesContainer.appendChild(probe);

    const colW = (grid.clientWidth - GRID_GAP * (COLS_PER_PAGE - 1)) / COLS_PER_PAGE;
    CELL_UNIT_H = colW / 0.65;
    ROWS_PER_PAGE = Math.max(1, Math.floor((grid.clientHeight + GRID_GAP) / (CELL_UNIT_H + GRID_GAP)));

    probe.remove();
}

// 构建一页 A4
function buildPage() {
    const page = document.createElement('div');
    page.classList.add('a4-page');

    // 页眉
    page.appendChild(buildPageHeader());

    const grid = document.createElement('div');
    grid.classList.add('grid-container');
    if (CELL_UNIT_H > 0) {
        // 固定行高保证字格为正方形，页面底部自然留白
        grid.style.gridTemplateRows = `repeat(${ROWS_PER_PAGE}, ${CELL_UNIT_H}px)`;
        // 暴露给CSS：拼音字号等随格高变化的量统一以格高为基准计算
        grid.style.setProperty('--cell-h', `${CELL_UNIT_H}px`);
    }
    for (let i = 0; i < ROWS_PER_PAGE * COLS_PER_PAGE; i++) {
        const cell = createCell();
        // 固定每个字格的网格坐标，避免自动布局被显式定位的笔顺栏挤乱
        cell.style.gridRow = `${Math.floor(i / COLS_PER_PAGE) + 1}`;
        cell.style.gridColumn = `${(i % COLS_PER_PAGE) + 1}`;
        grid.appendChild(cell);
    }

    page.appendChild(grid);
    pagesContainer.appendChild(page);

    // 新页页眉与已有页保持一致
    syncHeaders();
}

// 确保页面数量与字数匹配（每页 ROWS_PER_PAGE 行，每行 1 个字）
function ensurePageCount(count) {
    while (pagesContainer.children.length < count) {
        buildPage();
    }
    while (pagesContainer.children.length > count) {
        pagesContainer.lastChild.remove();
    }
}

// 监听输入框的变化
characterInput.addEventListener('input', () => {
    updateCharacters();
});

// 监听字体大小、描红数量选择框的变化
fontSizeSelect.addEventListener('change', () => {
    updateCharacters();
});
traceCountSelect.addEventListener('change', () => {
    updateCharacters();
});

// 监听田字格/米字格切换
gridTypeSelect.addEventListener('change', () => {
    pagesContainer.classList.toggle('mi-grid', gridTypeSelect.value === 'mi');
});

// 监听笔顺拆解图开关
strokeStripToggle.addEventListener('change', () => {
    updateCharacters();
});

// 页眉编辑时同步到所有页
pagesContainer.addEventListener('input', (e) => {
    const header = e.target.closest('.page-header');
    if (header) {
        syncHeaders(header);
    }
});

// 更新汉字和拼音显示
function updateCharacters() {
    const inputText = characterInput.value; // 获取输入框内容
    const characters = []; // 用于存储有效的汉字

    // 过滤出汉字
    for (const char of inputText) {
        if (/^[\u4e00-\u9fa5]$/.test(char)) { // 使用正则表达式检查是否为汉字
            characters.push(char);
        }
    }

    // 根据字数确保页数
    ensurePageCount(Math.max(1, Math.ceil(characters.length / ROWS_PER_PAGE)));

    const cells = document.querySelectorAll('.cell'); // 获取所有田字格
    // 字号按写字区（正方形边长）的百分比自适应，保证字面永不压线出格
    const gridEdge = CELL_UNIT_H > 0 ? CELL_UNIT_H * 0.65 : 48; // 写字区边长
    const fontSize = (parseInt(fontSizeSelect.value, 10) / 100) * gridEdge + 'px';
    const traceCount = parseInt(traceCountSelect.value, 10); // 描红数量
    const stripEnabled = strokeStripToggle.checked; // 是否印笔顺拆解栏
    const traceStart = stripEnabled ? 1 + STRIP_COLS : 1; // 描红起始列（笔顺栏开启时让位）
    const effectiveTrace = Math.min(traceCount, COLS_PER_PAGE - traceStart); // 描红数量按剩余空间截断

    // 清空所有田字格的内容 + 移除旧笔顺栏
    document.querySelectorAll('.stroke-strip').forEach(el => el.remove());
    cells.forEach(cell => {
        // 清空汉字
        const existingCharacter = cell.querySelector('.character');
        if (existingCharacter) {
            cell.removeChild(existingCharacter);
        }

        // 清空拼音
        const pinyinText = cell.querySelector('.pinyin-text');
        if (pinyinText) {
            pinyinText.textContent = '';
        }

        // 清空拼音选择图标
        const pinyinSelectIcon = cell.querySelector('.pinyin-select-icon');
        if (pinyinSelectIcon) {
            pinyinSelectIcon.remove();
        }
    });

    // 填充汉字：每个字占一行（示范字 + 描红字 + 空白格）
    characters.forEach((char, index) => {
        const rowStart = index * COLS_PER_PAGE; // 该行第一个田字格
        const targetCell = cells[rowStart];
        if (!targetCell) {
            return;
        }

        // 添加示范字
        fillCell(targetCell, char, fontSize, false);

        // 获取拼音
        const pinyinResult = pinyin(char, { multiple: true, type: 'array' });
        const pinyinText = targetCell.querySelector('.pinyin-text');

        // 如果拼音是数组（多音字），显示选择图标
        if (Array.isArray(pinyinResult) && pinyinResult.length > 1) {
            // 添加拼音文本
            if (pinyinText) {
                pinyinText.textContent = pinyinResult[0];
            }

            // 动态计算拼音文本的宽度
            const pinyinTextWidth = pinyinText ? pinyinText.offsetWidth : 0;

            // 添加拼音选择图标（单色 SVG，避免彩色 emoji 与整体风格冲突）
            const pinyinSelectIcon = document.createElement('span');
            pinyinSelectIcon.classList.add('pinyin-select-icon');
            pinyinSelectIcon.title = '点击选择拼音';
            pinyinSelectIcon.innerHTML =
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
            pinyinSelectIcon.style.left = `calc(50% + ${pinyinTextWidth / 2}px + 5px)`; // 动态定位在拼音文本右侧
            pinyinSelectIcon.addEventListener('click', () => {
                showPinyinModal(char, pinyinResult, targetCell);
            });

            // 将图标添加到拼音横线区域
            const pinyinLines = targetCell.querySelector('.pinyin-lines');
            pinyinLines.appendChild(pinyinSelectIcon);
        } else {
            // 单音字直接显示拼音
            if (pinyinText) {
                pinyinText.textContent = Array.isArray(pinyinResult) ? pinyinResult[0] : pinyinResult;
            }
        }

        // 添加描红字
        for (let t = 0; t < effectiveTrace; t++) {
            const traceCell = cells[rowStart + traceStart + t];
            if (traceCell) {
                fillCell(traceCell, char, fontSize, true);
            }
        }

        // 添加笔顺拆解栏（示范格右侧，横跨 STRIP_COLS 格的独立盒子）
        if (stripEnabled) {
            const pageIdx = Math.floor(index / ROWS_PER_PAGE);
            const grid = pagesContainer.children[pageIdx] && pagesContainer.children[pageIdx].querySelector('.grid-container');
            if (grid) {
                const strip = document.createElement('div');
                strip.classList.add('stroke-strip');
                strip.style.gridRow = `${(index % ROWS_PER_PAGE) + 1}`;
                strip.style.gridColumn = `2 / span ${STRIP_COLS}`;

                // 笔画序列单独一层：横向滚动时计数徽标固定不动
                const frames = document.createElement('div');
                frames.classList.add('stroke-frames');
                strip.appendChild(frames);

                grid.appendChild(strip);
                mountStrokeStrip(strip, frames, char);
            }
        }
    });
}

// 向田字格填充汉字（isTrace 为 true 时显示为浅灰描红字）
function fillCell(cell, char, fontSize, isTrace) {
    const characterElement = document.createElement('div');
    characterElement.classList.add('character');
    if (isTrace) {
        characterElement.classList.add('trace');
    } else {
        // 示范字可点击查看笔顺演示
        characterElement.title = '点击演示笔顺';
        characterElement.addEventListener('click', () => {
            showStrokeModal(char);
        });
    }
    characterElement.textContent = char;
    characterElement.style.fontSize = fontSize; // 设置字体大小
    cell.appendChild(characterElement);
}

// 笔画数据缓存（拆解图复用，同字秒开）
const strokeDataCache = new Map();
// 进行中的请求（同字并发时复用，避免一次输入打出多个重复请求）
const strokeDataPending = new Map();

const STROKE_TIMEOUT = 10000; // 笔画数据加载超时（毫秒）

// 加载单字笔画数据（与动画同源：jsdelivr CDN）
function loadStrokeData(char) {
    if (strokeDataCache.has(char)) {
        return Promise.resolve(strokeDataCache.get(char));
    }
    if (strokeDataPending.has(char)) {
        return strokeDataPending.get(char);
    }

    const task = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        // 超时兜底：网络不通时 XHR 可能长时间挂起，导致笔顺栏一直空白
        const timer = setTimeout(() => {
            xhr.abort();
            reject(new Error('笔画数据加载超时'));
        }, STROKE_TIMEOUT);

        xhr.open('GET', `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`);
        xhr.onload = () => {
            clearTimeout(timer);
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                strokeDataCache.set(char, data);
                resolve(data);
            } else {
                reject(new Error('笔画数据加载失败'));
            }
        };
        xhr.onerror = () => {
            clearTimeout(timer);
            reject(new Error('笔画数据加载失败'));
        };
        xhr.send();
    });

    strokeDataPending.set(char, task);
    const clear = () => strokeDataPending.delete(char);
    task.then(clear, clear);
    return task;
}

// 挂载笔顺栏：加载中显示骨架线，失败降级为可点击重试的提示
function mountStrokeStrip(strip, frames, char) {
    const run = () => {
        if (!strip.isConnected) {
            return; // 字帖已重建，丢弃过期请求
        }
        strip.classList.remove('is-error');
        strip.classList.add('is-loading');
        strip.onclick = null;
        frames.textContent = '';

        loadStrokeData(char)
            .then(data => renderStrokeStrip(strip, frames, data))
            .catch(() => {
                if (!strip.isConnected) {
                    return;
                }
                strip.classList.remove('is-loading');
                strip.classList.add('is-error');
                frames.textContent = '笔顺图加载失败 · 点击重试';
                strip.title = '点击重试';
                strip.onclick = run;
            });
    };

    run();
}

// 构建笔画拆解图：逐步叠加每一笔，最新一笔标红
function buildStrokeSteps(container, data, onStepClick) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const lastStroke = data.strokes.length - 1;

    container.innerHTML = '';
    data.strokes.forEach((_, i) => {
        const step = document.createElement('div');
        step.classList.add('stroke-step');

        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 1024 1024');
        const group = document.createElementNS(svgNS, 'g');
        group.setAttribute('transform', 'scale(1, -1) translate(0, -900)');
        for (let j = 0; j <= i; j++) {
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', data.strokes[j]);
            // 最新一笔标红，此前笔画淡化；最后一步为完整字
            if (j === i && i !== lastStroke) {
                path.setAttribute('fill', '#E53935');
                path.setAttribute('fill-opacity', '1');
            } else {
                path.setAttribute('fill', '#333333');
                path.setAttribute('fill-opacity', i === lastStroke ? '1' : '0.35');
            }
            group.appendChild(path);
        }
        svg.appendChild(group);
        step.appendChild(svg);

        const label = document.createElement('div');
        label.classList.add('stroke-step-label');
        label.textContent = i === lastStroke ? '完成' : `第${i + 1}笔`;
        step.appendChild(label);

        step.addEventListener('click', () => onStepClick(i));
        container.appendChild(step);
    });
}

const STRIP_GAP = 2; // 与 CSS .stroke-frames 的 gap 保持一致
const STRIP_MAX = 34; // 单个缩略图最大边长，与 CSS .stroke-frame 的 max-width 保持一致

// 在 width×height 内为 count 个正方形缩略图选最优列数。
// 枚举所有列数，取「单格边长最大」者：既保证全部笔画可见（不溢出裁切），
// 又让每个缩略图尽可能大。笔画少时封顶 34px，笔画多时自动降格换行。
function pickStrokeLayout(count, width, height) {
    if (count <= 0) {
        return { cols: 1, size: 0 };
    }
    if (width <= 0 || height <= 0) {
        return { cols: count, size: 0 };
    }

    let best = { cols: 1, size: -1 };
    for (let cols = 1; cols <= count; cols++) {
        const rows = Math.ceil(count / cols);
        const size = Math.min(
            (width - STRIP_GAP * (cols - 1)) / cols,
            (height - STRIP_GAP * (rows - 1)) / rows,
            STRIP_MAX
        );
        if (size > best.size) {
            best = { cols, size };
        }
    }
    return best;
}

// 在字帖纸上渲染笔顺拆解栏（逐笔叠加小图，最后一步为完整字）
function renderStrokeStrip(strip, frames, data) {
    if (!strip.isConnected) {
        return; // 字帖已重建，丢弃过期渲染
    }
    const svgNS = 'http://www.w3.org/2000/svg';
    const lastStroke = data.strokes.length - 1;
    const total = data.strokes.length;

    strip.classList.remove('is-loading', 'is-error');
    frames.textContent = '';

    // 栏已入 DOM，按内容盒量可用尺寸（clientWidth 含 padding，需扣掉给计数预留的右侧留白）
    const cs = getComputedStyle(frames);
    const availW = frames.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = frames.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    // 显式写死列宽/行高，避免 aspect-ratio 与 1fr 互相打架
    const layout = pickStrokeLayout(total, availW, availH);
    frames.style.gridTemplateColumns = `repeat(${layout.cols}, ${layout.size}px)`;
    frames.style.gridAutoRows = `${layout.size}px`;

    data.strokes.forEach((_, i) => {
        const isLast = i === lastStroke;
        const frame = document.createElement('div');
        frame.classList.add('stroke-frame');

        // 笔序号角标：网格排布下靠它建立阅读顺序。末笔同样标数字以保持序列完整，
        // 其「成品态」由满格黑字自证，不再额外加色强调
        const num = document.createElement('span');
        num.classList.add('stroke-frame-num');
        num.textContent = String(i + 1);
        frame.appendChild(num);

        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 1024 1024');
        const group = document.createElementNS(svgNS, 'g');
        group.setAttribute('transform', 'scale(1, -1) translate(0, -900)');
        for (let j = 0; j <= i; j++) {
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', data.strokes[j]);
            // 已写笔画保留足够对比度以看清字形轮廓与位置，当前这一笔用红色突出；末笔为完整黑字
            if (j === i && !isLast) {
                path.setAttribute('fill', '#E53935');
                path.setAttribute('fill-opacity', '1');
            } else {
                path.setAttribute('fill', '#333333');
                path.setAttribute('fill-opacity', isLast ? '1' : 0.4);
            }
            group.appendChild(path);
        }
        svg.appendChild(group);
        frame.appendChild(svg);
        frames.appendChild(frame);
    });

    // 笔序已由每格角标给出，不再叠加总数徽标（会压住第 1 格的序号）
    strip.title = `共 ${total} 笔`;
}

// 模态框外壳（拼音选择 / 笔顺演示 共用）：遮罩 + 卡片 + 标题 + 右上角关闭按钮
function createModal(titleText, extraClass) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    if (extraClass) {
        modal.classList.add(extraClass);
    }

    const content = document.createElement('div');
    content.classList.add('modal-content');

    const title = document.createElement('div');
    title.classList.add('modal-title');
    title.textContent = titleText;
    content.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.classList.add('modal-close');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', '关闭');
    closeButton.textContent = '×';
    content.appendChild(closeButton);

    modal.appendChild(content);
    document.body.appendChild(modal);

    const close = () => modal.remove();
    closeButton.addEventListener('click', close);
    // 点击遮罩关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            close();
        }
    });

    return { modal, content, close };
}

// 显示笔顺演示模态框
function showStrokeModal(char) {
    // 避免重复打开
    const existing = document.querySelector('.stroke-modal');
    if (existing) {
        existing.remove();
    }

    const { content, close } = createModal(`"${char}" 的笔顺演示`, 'stroke-modal');

    const writerTarget = document.createElement('div');
    content.appendChild(writerTarget);

    // 笔画拆解图区域
    const stepsContainer = document.createElement('div');
    stepsContainer.classList.add('stroke-steps');
    stepsContainer.textContent = '拆解图加载中…';
    content.appendChild(stepsContainer);

    const actions = document.createElement('div');
    actions.classList.add('stroke-modal-actions');

    const replayButton = document.createElement('button');
    replayButton.textContent = '重播';
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    actions.appendChild(replayButton);
    actions.appendChild(closeButton);
    content.appendChild(actions);

    // 创建笔顺动画
    const writerConfig = {
        width: 260,
        height: 260,
        padding: 10,
        strokeColor: '#333333',
        radicalColor: '#168F16',
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 300,
        onLoadError: () => {
            writerTarget.textContent = '笔顺数据加载失败，请检查网络后重试';
        },
    };

    let writer = null;
    try {
        writer = HanziWriter.create(writerTarget, char, writerConfig);
        writer.animateCharacter();
    } catch (e) {
        writerTarget.textContent = '笔顺数据加载失败，请检查网络后重试';
    }

    // 点击拆解图小图：重置动画并逐笔播放到该笔
    const playToStroke = (strokeNum) => {
        if (!writer) {
            return;
        }
        writerTarget.innerHTML = '';
        writer = HanziWriter.create(writerTarget, char, writerConfig);
        writer.showOutline();
        let chain = Promise.resolve();
        for (let i = 0; i <= strokeNum; i++) {
            chain = chain.then(() => writer.animateStroke(i));
        }
    };

    // 加载笔画数据并渲染拆解图
    loadStrokeData(char)
        .then(data => {
            buildStrokeSteps(stepsContainer, data, playToStroke);
        })
        .catch(() => {
            stepsContainer.textContent = '拆解图加载失败，请检查网络';
        });

    replayButton.addEventListener('click', () => {
        if (writer) {
            writer.animateCharacter();
        }
    });

    closeButton.addEventListener('click', close);
}

// 显示拼音选择模态框
function showPinyinModal(char, pinyinOptions, targetCell) {
    const { content, close } = createModal(`请选择 "${char}" 的拼音`, 'pinyin-modal');

    pinyinOptions.forEach(py => {
        const option = document.createElement('div');
        option.classList.add('pinyin-modal-option');
        option.textContent = py;
        option.addEventListener('click', () => {
            const pinyinText = targetCell.querySelector('.pinyin-text');
            if (pinyinText) {
                pinyinText.textContent = py;
            }
            close();
        });
        content.appendChild(option);
    });
}

// 生成时间戳的函数（格式：yyyyMMddHHmmss）
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份补零
    const day = String(now.getDate()).padStart(2, '0'); // 日期补零
    const hours = String(now.getHours()).padStart(2, '0'); // 小时补零
    const minutes = String(now.getMinutes()).padStart(2, '0'); // 分钟补零
    const seconds = String(now.getSeconds()).padStart(2, '0'); // 秒补零

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// 获取保存按钮和容器
const saveDropdown = document.querySelector('.save-dropdown');
const saveButton = document.getElementById('save-button');
const saveOptions = document.querySelector('.save-options');

// 点击保存按钮显示/隐藏选项
saveButton.addEventListener('click', (e) => {
    e.stopPropagation();
    saveDropdown.classList.toggle('open');
});

// 点击选项处理保存
saveOptions.addEventListener('click', (e) => {
    if (e.target.classList.contains('save-option')) {
        const format = e.target.dataset.format;
        saveDropdown.classList.remove('open');

        if (format === 'image') {
            saveAsImage();
        } else if (format === 'pdf') {
            saveAsPdf();
        } else if (format === 'print') {
            window.print(); // 直接打印
        }
    }
});

// 点击页面其他位置关闭下拉菜单
document.addEventListener('click', () => {
    saveDropdown.classList.remove('open');
});

// 通用隐藏拼音图标函数
function hidePinyinIcons() {
    const pinyinIcons = document.querySelectorAll('.pinyin-select-icon');
    pinyinIcons.forEach(icon => {
        icon.style.display = 'none';
    });
}

// 通用显示拼音图标函数
function showPinyinIcons() {
    const pinyinIcons = document.querySelectorAll('.pinyin-select-icon');
    pinyinIcons.forEach(icon => {
        icon.style.display = 'flex';
    });
}

// 保存为图片（多页时纵向拼接为一张长图）
function saveAsImage() {
    const pages = Array.from(document.querySelectorAll('.a4-page'));
    hidePinyinIcons();

    const canvases = [];
    let chain = Promise.resolve();
    pages.forEach(page => {
        chain = chain.then(() => html2canvas(page, {
            scale: 2,
            useCORS: true,
        }).then(canvas => {
            canvases.push(canvas);
        }));
    });

    chain.then(() => {
        let mergedCanvas = canvases[0];
        if (canvases.length > 1) {
            const gap = 40; // 页间距（2倍缩放下的 20px）
            const width = canvases[0].width;
            const height = canvases.reduce((sum, c) => sum + c.height, 0) + gap * (canvases.length - 1);

            mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = width;
            mergedCanvas.height = height;
            const ctx = mergedCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            let y = 0;
            canvases.forEach(c => {
                ctx.drawImage(c, 0, y);
                y += c.height + gap;
            });
        }

        const link = document.createElement('a');
        link.href = mergedCanvas.toDataURL('image/png');
        const timestamp = getTimestamp();
        const fileName = `tzg-${timestamp}.png`;
        link.download = fileName;
        link.click();
        showPinyinIcons();
    });
}

// 保存为PDF（多页时导出多页PDF）
function saveAsPdf() {
    const pages = Array.from(document.querySelectorAll('.a4-page'));
    hidePinyinIcons();

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    let chain = Promise.resolve();
    pages.forEach((page, index) => {
        chain = chain.then(() => html2canvas(page, {
            scale: 2,
            useCORS: true,
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (index > 0) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        }));
    });

    chain.then(() => {
        const timestamp = getTimestamp();
        const fileName = `tzg-${timestamp}.pdf`;
        pdf.save(fileName);
        showPinyinIcons();
    });
}

// 初始化：计算正方形字格布局后生成第一页
computeRowsPerPage();
updateCharacters();
