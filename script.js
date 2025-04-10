// Импорт Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDyLLgQeRNghUjsCF4aGnwVvrvPfuwf0r8",
    authDomain: "furniture-catalog-35e3e.firebaseapp.com",
    projectId: "furniture-catalog-35e3e",
    storageBucket: "furniture-catalog-35e3e.firebasestorage.app",
    messagingSenderId: "705330640295",
    appId: "1:705330640295:web:055306fbfc3f95c36cb282",
    measurementId: "G-98YM4XPHN7"
};

// Инициализация Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase инициализирован успешно.");
} catch (error) {
    console.error("Ошибка инициализации Firebase:", error);
    alert("Ошибка подключения к Firebase. Проверьте конфигурацию в script.js.");
}

// Определение категорий и соответствующих номеров предметов
const categories = {
    'vintage_antique': ['8', '11', '12', '13', '14', '32', '33', '34', '38', '88', '89', '90', '95', '100', '103', '17', '81'],
    'vintage_possible': ['5', '10', '12', '13', '15', '16', '19', '20', '21', '22', '23', '34', '39', '43', '44', '46', '47', '48', '50', '51', '52', '53', '84', '85', '102', '104'],
    'modern_expensive': ['105', '101', '98', '97', '96'],
    'modern_attribution': ['80', '61', '42', '41', '36', '35', '26', '7', '4', '3', '2'],
    'sofas': ['70', '71', '72', '73', '74', '75', '76', '77', '78', '79'],
    'modern_sofas': ['80', '61', '42', '41', '36', '35', '26', '7', '4', '3', '2', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79']
};

// Получение категории из URL
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category') || 'all';

// Проверка, является ли текущая страница modern_sofas
const isModernSofasPage = category === 'modern_sofas';

// Проверка, является ли текущая страница warehouse.html
const currentPage = window.location.pathname.split('/').pop();
const isWarehousePage = currentPage === 'warehouse.html';

document.addEventListener('DOMContentLoaded', async () => {
    const table = document.getElementById('furnitureTable');
    const thead = document.getElementById('tableHeader');
    const tbody = document.getElementById('tableBody');
    const tfoot = document.getElementById('tableFooter');
    const saveButton = document.getElementById('saveButton');
    const modal = document.getElementById('galleryModal');
    const mainImage = document.getElementById('mainImage');
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    const closeBtn = document.querySelector('.close');
    const arrowLeft = document.getElementById('arrowLeft');
    const arrowRight = document.getElementById('arrowRight');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const confirmModal = document.getElementById('confirmModal');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    const userInfoModal = document.getElementById('userInfoModal');
    const userInfoForm = document.getElementById('userInfoForm');
    const userInfoCloseBtn = userInfoModal ? userInfoModal.querySelector('.close') : null;
    let currentIndex = 0;
    let images = [];
    let furnitureData = [];

    // Загрузка данных в зависимости от страницы
    let dataUrl = isWarehousePage ? 'warehouse_data.json' : 'furniture_catalog.json';
    let imagesUrl = isWarehousePage ? 'warehouse_images.json' : 'images.json';

    // Загрузка данных
    try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        furnitureData = await response.json();
    } catch (error) {
        console.error(`Ошибка загрузки ${dataUrl}:`, error);
        return;
    }

    // Фильтрация данных по категории (только для страниц, кроме warehouse.html)
    if (!isWarehousePage && category !== 'all') {
        const allowedItems = categories[category] || [];
        furnitureData = furnitureData.filter(item => allowedItems.includes(item['№№']));
    }

    // Загрузка изображений
    let imageData = {};
    try {
        const response = await fetch(imagesUrl);
        if (!response.ok) {
            console.warn(`Файл ${imagesUrl} не найден или пуст. Используются заглушки.`);
            imageData = {};
        } else {
            imageData = await response.json();
        }
    } catch (error) {
        console.error(`Ошибка загрузки ${imagesUrl}:`, error);
        imageData = {};
    }

    // Динамическое создание заголовков
    let headers = [];
    if (isWarehousePage) {
        headers = ['№', 'Название', 'Фото'];
    } else {
        headers = Object.keys(furnitureData[0] || {}).filter(header => header !== 'data-prefix' && header !== 'Пользовательская оценка');
        if (isModernSofasPage) {
            headers = [...headers, 'На продажу', 'Ценный предмет'];
        } else {
            headers = [...headers, 'Пользовательская оценка'];
        }
    }

    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        if (header === 'Оценка (агент TwoTables), за 1 шт.') {
            th.textContent = 'Оценка (агент TwoTables)';
        } else {
            th.textContent = header;
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Заполнение таблицы данными
    let totalCost = 0;
    furnitureData.forEach((item, rowIndex) => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.setAttribute('data-label', header === 'Оценка (агент TwoTables), за 1 шт.' ? 'Оценка (агент TwoTables)' : header);
            if (header === 'Фото') {
                const prefix = isWarehousePage
                    ? 'imgsklad' + (parseInt(item['№']) < 10 ? parseInt(item['№']) : item['№'].padStart(3, '0'))
                    : (item['data-prefix'] || `item${item['№№']}`);
                const img = document.createElement('img');
                img.className = 'thumbnail';
                img.setAttribute('data-prefix', prefix);
                img.setAttribute('loading', 'lazy');
                img.setAttribute('alt', item['Название'] || 'Изображение');
                const imageList = imageData[prefix] || [];
                img.src = imageList.length > 0 ? imageList[0] : 'img/placeholder.webp';
                td.appendChild(img);
            } else if (header === 'Оценка (агент TwoTables), за 1 шт.' && !isWarehousePage) {
                const cost = item[header] || 0;
                td.textContent = cost > 0 ? cost.toLocaleString('ru-RU') + ' ₽' : '';
                td.style.textAlign = 'right';
                const quantity = parseInt(item['Количество, шт.']) || 1;
                totalCost += cost * quantity;
            } else if (header === 'На продажу' && isModernSofasPage) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'for-sale';
                checkbox.checked = item['На продажу'] || false;
                checkbox.addEventListener('change', () => {
                    furnitureData[rowIndex]['На продажу'] = checkbox.checked;
                });
                td.appendChild(checkbox);
                td.style.textAlign = 'center';
            } else if (header === 'Ценный предмет' && isModernSofasPage) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'valuable';
                checkbox.checked = item['Ценный предмет'] || false;
                checkbox.addEventListener('change', () => {
                    furnitureData[rowIndex]['Ценный предмет'] = checkbox.checked;
                });
                td.appendChild(checkbox);
                td.style.textAlign = 'center';
            } else if (header === 'Пользовательская оценка' && !isModernSofasPage && !isWarehousePage) {
                td.className = 'editable';
                td.setAttribute('contenteditable', 'true');
                td.textContent = item[header] || '';
                td.style.textAlign = 'right';
                td.addEventListener('input', (e) => {
                    furnitureData[rowIndex][header] = e.target.textContent;
                });
            } else {
                td.textContent = item[header] || '';
                if (header === '№' || header === '№№' || header === 'Количество, шт.') {
                    td.style.textAlign = 'right';
                }
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    // Добавление итоговой строки (только для страниц, кроме warehouse.html)
    if (!isWarehousePage) {
        const totalRow = document.createElement('tr');
        const totalLabelCell = document.createElement('td');
        totalLabelCell.colSpan = headers.length - 1;
        totalLabelCell.textContent = 'Итоговая стоимость (агент TwoTables):';
        totalLabelCell.style.textAlign = 'right';
        totalLabelCell.classList.add('total-cost');
        const totalValueCell = document.createElement('td');
        totalValueCell.textContent = totalCost.toLocaleString('ru-RU') + ' ₽';
        totalValueCell.style.textAlign = 'right';
        totalValueCell.classList.add('total-cost');
        totalRow.appendChild(totalLabelCell);
        totalRow.appendChild(totalValueCell);
        tfoot.appendChild(totalRow);
    }

    // Открытие модального окна для подтверждения (только для modern_sofas)
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            confirmModal.style.display = 'flex';
        });
    }

    // Обработка кнопки "Да" в модальном окне подтверждения
    if (confirmYes) {
        confirmYes.addEventListener('click', () => {
            confirmModal.style.display = 'none';
            userInfoModal.style.display = 'flex';
        });
    }

    // Обработка кнопки "Нет" в модальном окне подтверждения
    if (confirmNo) {
        confirmNo.addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
    }

    // Закрытие модального окна подтверждения при клике на крестик
    if (confirmModal) {
        confirmModal.querySelector('.close').addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });

        // Закрытие модального окна подтверждения при клике вне окна
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.style.display = 'none';
            }
        });
    }

    // Сохранение данных после ввода имени и телефона
    if (userInfoForm) {
        userInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userName = document.getElementById('userName').value.trim();
            const userPhone = document.getElementById('userPhone').value.trim();

            if (!userName) {
                alert('Пожалуйста, введите ваше имя.');
                return;
            }

            try {
                // Формирование сообщения для Telegram
                const moscowTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', hour12: false });
                const itemsWithSelection = furnitureData.filter(item => item['На продажу'] || item['Ценный предмет']);
                let telegramMessage = `🔔 Новые данные по современной мебели и диванам от ${userName} (${userPhone})\n`;
                telegramMessage += `Время (Москва): ${moscowTime}\n\n`;
                if (itemsWithSelection.length > 0) {
                    itemsWithSelection.forEach(item => {
                        telegramMessage += `- №: ${item['№№']}\n`;
                        telegramMessage += `  Наименование: ${item['Название'] || 'Не указано'}\n`;
                        telegramMessage += `  На продажу: ${item['На продажу'] ? 'Да' : 'Нет'}\n`;
                        telegramMessage += `  Ценный предмет: ${item['Ценный предмет'] ? 'Да' : 'Нет'}\n\n`;
                    });
                } else {
                    telegramMessage += 'Нет выбранных предметов.\n';
                }

                // Отправка в Telegram через iframe
                const iframe = document.createElement('iframe');
                iframe.src = 'telegram-proxy.html';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                iframe.onload = () => {
                    iframe.contentWindow.postMessage({ message: telegramMessage }, 'https://gvantonov.github.io');
                };

                // Сохранение данных в Firestore
                await addDoc(collection(db, 'modern_sofas_submissions'), {
                    userName: userName,
                    userPhone: userPhone,
                    data: furnitureData,
                    timestamp: new Date().toISOString()
                });

                // Заменяем содержимое модального окна на сообщение об успешной отправке
                const modalContent = userInfoModal.querySelector('.modal-content');
                modalContent.innerHTML = `
                    <span class="close">×</span>
                    <div class="success-message">
                        <p>Ваши данные успешно сохранены и отправлены.</p>
                        <p>Если у вас есть дополнительные вопросы — напишите в WhatsApp</p>
                        <a href="http://wa.me/79153555202" target="_blank" class="whatsapp-link">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' class='whatsapp-icon'%3E%3C