// 获取网格容器、输入框和字体大小选择框
const gridContainer = document.getElementById('grid-container');
const characterInput = document.getElementById('character-input');
const fontSizeSelect = document.getElementById('font-size-select');
const saveButton = document.getElementById('save-button');

var { pinyin } = pinyinPro;

// 生成 11x11 的田字格
for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 11; col++) {
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
        gridContainer.appendChild(cell);
    }
}

// 监听输入框的变化
characterInput.addEventListener('input', () => {
    updateCharacters();
});

// 监听字体大小选择框的变化
fontSizeSelect.addEventListener('change', () => {
    updateCharacters();
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

    const cells = document.querySelectorAll('.cell'); // 获取所有田字格
    const fontSize = fontSizeSelect.value + 'px'; // 获取选择的字体大小

    // 清空所有田字格的内容
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

    // 将汉字和拼音填充到每行的第一个田字格中
    characters.forEach((char, index) => {
        const targetCell = cells[index * 11]; // 每行的第一个田字格
        if (targetCell) {
            // 添加汉字
            const characterElement = document.createElement('div');
            characterElement.classList.add('character');
            characterElement.textContent = char;
            characterElement.style.fontSize = fontSize; // 设置字体大小
            targetCell.appendChild(characterElement);

            // 获取拼音
            const pinyinResult = pinyin(char, { multiple: true, type: 'array' });

            // 如果拼音是数组（多音字），显示选择图标
            if (Array.isArray(pinyinResult) && pinyinResult.length > 1) {
                // 添加拼音文本
                const pinyinText = targetCell.querySelector('.pinyin-text');
                if (pinyinText) {
                    pinyinText.textContent = pinyinResult[0];
                }

                // 动态计算拼音文本的宽度
                const pinyinTextWidth = pinyinText.offsetWidth;

                // 添加拼音选择图标
                const pinyinSelectIcon = document.createElement('span');
                pinyinSelectIcon.classList.add('pinyin-select-icon');
                pinyinSelectIcon.textContent = '🖉'; // 使用铅笔图标
                pinyinSelectIcon.style.left = `calc(50% + ${pinyinTextWidth / 2}px + 5px)`; // 动态定位在拼音文本右侧
                pinyinSelectIcon.addEventListener('click', () => {
                    showPinyinModal(char, pinyinResult, targetCell);
                });

                // 将图标添加到拼音横线区域
                const pinyinLines = targetCell.querySelector('.pinyin-lines');
                pinyinLines.appendChild(pinyinSelectIcon);
            } else {
                // 单音字直接显示拼音
                const pinyinText = targetCell.querySelector('.pinyin-text');
                if (pinyinText) {
                    pinyinText.textContent = pinyinResult;
                }
            }
        }
    });
}

// 显示拼音选择模态框
function showPinyinModal(char, pinyinOptions, targetCell) {
    const modal = document.createElement('div');
    modal.classList.add('pinyin-modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('pinyin-modal-content');

    const modalTitle = document.createElement('div');
    modalTitle.classList.add('pinyin-modal-title');
    modalTitle.textContent = `请选择 "${char}" 的拼音：`;
    modalContent.appendChild(modalTitle);

    pinyinOptions.forEach(py => {
        const option = document.createElement('div');
        option.classList.add('pinyin-modal-option');
        option.textContent = py;
        option.addEventListener('click', () => {
            const pinyinText = targetCell.querySelector('.pinyin-text');
            if (pinyinText) {
                pinyinText.textContent = py;
            }
            modal.remove(); // 关闭模态框
        });
        modalContent.appendChild(option);
    });

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
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

// 保存为图片
saveButton.addEventListener('click', () => {
    const a4Page = document.getElementById('a4-page');

    const pinyinIcons = document.querySelectorAll('.pinyin-select-icon');
    // 隐藏所有拼音选择图标
    pinyinIcons.forEach(icon => {
        icon.style.display = 'none';
    });

    html2canvas(a4Page, {
        scale: 2, // 提高图片清晰度
        useCORS: true, // 允许跨域资源
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        // 生成时间戳并附加到文件名中
        const timestamp = getTimestamp(); // 获取时间戳
        const fileName = `tzg-${timestamp}.png`; // 新文件名

        link.download = fileName; // 设置下载文件名
        link.click();

        // 保存完成后显示拼音选择图标
        pinyinIcons.forEach(icon => {
            icon.style.display = 'block';
        });
    });
});