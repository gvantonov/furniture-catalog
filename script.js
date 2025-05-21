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
}

// Определение категорий и соответствующих номеров предметов
const categories = {
    'vintage_antique': ['8', '11', '12', '13', '14', '17', '81', '32', '33', '34', '38', '88', '89', '90', '95', '100', '103'],
    'vintage_possible': ['5', '10', '12', '13', '15', '16', '19', '20', '21', '22', '23', '34', '37', '39', '43', '44', '46', '47', '48', '50', '51', '52', '53', '82', '83', '84', '85', '86', '102', '104'],
    'modern_expensive': ['105', '101', '98', '97', '96', '40', '45', '49', '18'],
    'modern_attribution': ['80', '61', '42', '41', '36', '35', '26', '7', '4', '3', '2'],
    'sofas': ['70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '99'],
    'modern_sofas': ['6', '9', '24', '25', '27', '28', '29', '30', '31', '54', '55', '56', '57', '58', '59', '60', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '87', '91', '92', '93', '94', '80', '61', '42', '41', '36', '35', '26', '7', '4', '3', '2']
};

// Определение предметов для страницы "На продажу (предложение ИК)"
const for_sale_ik_items = [
    { id: '2', source: 'Modern Sofas' }, { id: '3', source: 'Modern Sofas' }, { id: '4', source: 'Modern Sofas' },
    { id: '6', source: 'Modern Sofas' }, { id: '7', source: 'Modern Sofas' }, { id: '8', source: 'Склад' },
    { id: '11', source: 'Склад' }, { id: '12', source: 'Склад' }, { id: '24', source: 'Modern Sofas' },
    { id: '25', source: 'Modern Sofas' }, { id: '27', source: 'Modern Sofas' }, { id: '28', source: 'Modern Sofas' },
    { id: '29', source: 'Modern Sofas' }, { id: '30', 'Modern Sofas' }, { id: '31', source: 'Modern Sofas' },
    { id: '32', source: 'Склад' }, { id: '50', source: 'Склад' }, { id: '51', source: 'Склад' },
    { id: '57', source: 'Склад' }, { id: '58', source: 'Modern Sofas' }, { id: '58', source: 'Склад' },
    { id: '59', source: 'Modern Sofas' }, { id: '60', source: 'Modern Sofas' }, { id: '62', source: 'Modern Sofas' },
    { id: '63', source: 'Modern Sofas' }, { id: '65', source: 'Modern Sofas' }, { id: '66', source: 'Modern Sofas' },
    { id: '67', source: 'Modern Sofas' }, { id: '69', source: 'Склад' }, { id: '71', source: 'Modern Sofas' },
    { id: '72', source: 'Modern Sofas' }, { id: '76', source: 'Склад' }, { id: '79', source: 'Modern Sofas' },
    { id: '79', source: 'Склад' }, { id: '91', source: 'Склад' }, { id: '93', source: 'Склад' },
    { id: '114', source: 'Склад' }, { id: '116', source: 'Склад' }, { id: '133', source: 'Склад' },
    { id: '198', source: 'Склад' }, { id: '199', source: 'Склад' }, { id: '213', source: 'Склад' },
    { id: '214', source: 'Склад' }, { id: '217', source: 'Склад' }, { id: '218', source: 'Склад' },
    { id: '227', source: 'Склад' }
];

// Получение категории из URL
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category') || 'all';

// Проверка, является ли текущая страница modern_sofas, warehouse, survey или for_sale_ik
const currentPage = window.location.pathname.split('/').pop();
const isModernSofasPage = category === 'modern_sofas';
const isWarehousePage = currentPage === 'warehouse.html';
const isSurveyPage = currentPage === 'survey.html';
const isForSaleIkPage = currentPage === 'for_sale_ik.html';

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

    // Загрузка данных
    let catalogData = [];
    let warehouseData = [];
    let imageData = {};

    // Загрузка furniture_catalog.json
    try {
        const response = await fetch('furniture_catalog.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        catalogData = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки furniture_catalog.json:', error);
    }

    // Фильтрация данных для modern_sofas (для survey.html, modern_sofas.html и for_sale_ik.html)
    let modernSofasData = [];
    if (isModernSofasPage || isSurveyPage || isForSaleIkPage) {
        const allowedItems = categories['modern_sofas'] || [];
        modernSofasData = catalogData.filter(item => allowedItems.includes(item['№№']));
    }

    // Загрузка warehouse_data.json (для survey.html, warehouse.html и for_sale_ik.html)
    if (isSurveyPage || isWarehousePage || isForSaleIkPage) {
        try {
            const response = await fetch('warehouse_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            warehouseData = await response.json();
            // Нормализуем данные из warehouse_data.json, добавляя пустые значения для остальных столбцов
            warehouseData = warehouseData.map(item => ({
                "№№": item["№"],
                "Название": item["Название"],
                "Категория": "",
                "Цена": "",
                "Статус": "",
                "Количество, шт.": "",
                "Оценка (агент TwoTables), за 1 шт.": "",
                "Размеры (ВхШхГ)": "",
                "Наименование": "",
                "Гарнитур": "",
                "Материалы": "",
                "data-prefix": 'imgsklad' + (parseInt(item['№']) < 10 ? parseInt(item['№']) : item['№'].padStart(3, '0')),
                "source": "warehouse"
            }));
        } catch (error) {
            console.error('Ошибка загрузки warehouse_data.json:', error);
        }
    }

    // Объединяем данные
    if (isSurveyPage) {
        furnitureData = [...modernSofasData, ...warehouseData];
    } else if (isWarehousePage) {
        furnitureData = warehouseData;
    } else if (isModernSofasPage) {
        furnitureData = modernSofasData;
    } else if (isForSaleIkPage) {
        // Фильтрация для страницы "На продажу (предложение ИК)"
        furnitureData = [];
        for_sale_ik_items.forEach(({ id, source }) => {
            if (source === 'Modern Sofas') {
                const item = modernSofasData.find(item => item['№№'] === id);
                if (item) {
                    furnitureData.push({ ...item, source: 'Modern Sofas' });
                }
            } else if (source === 'Склад') {
                const item = warehouseData.find(item => item['№№'] === id);
                if (item) {
                    furnitureData.push({ ...item, source: 'warehouse' });
                }
            }
        });
    } else {
        furnitureData = catalogData;
    }

    // Фильтрация данных по категории (только для страниц, кроме warehouse.html, survey.html, modern_sofas.html и for_sale_ik.html)
    if (!isWarehousePage && !isSurveyPage && !isModernSofasPage && !isForSaleIkPage && category !== 'all') {
        const allowedItems = categories[category] || [];
        furnitureData = furnitureData.filter(item => allowedItems.includes(String(item['№№'])));
    }

    // Загрузка изображений
    let imagesUrl = isWarehousePage ? 'warehouse_images.json' : 'images.json';
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

    // Загрузка warehouse_images.json для survey.html и for_sale_ik.html (дополнительно)
    if (isSurveyPage || isForSaleIkPage) {
        try {
            const response = await fetch('warehouse_images.json');
            if (!response.ok) {
                console.warn('Файл warehouse_images.json не найден или пуст. Используются заглушки.');
            } else {
                const warehouseImages = await response.json();
                imageData = { ...imageData, ...warehouseImages };
            }
        } catch (error) {
            console.error('Ошибка загрузки warehouse_images.json:', error);
        }
    }

    // Динамическое создание заголовков
    let headers = [];
    if (isWarehousePage) {
        headers = ['№', 'Название', 'Фото'];
    } else if (isSurveyPage || isForSaleIkPage) {
        headers = ['№№', 'Фото', 'Название', 'Количество, шт.', 'Размеры (ВхШхГ)', 'Наименование', 'Гарнитур', 'На продажу', 'Ценный предмет'];
    } else {
        headers = Object.keys(catalogData[0] || {}).filter(header => header !== 'data-prefix' && header !== 'Пользовательская оценка');
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
                const prefix = item['data-prefix'] || (item['source'] === 'warehouse'
                    ? 'imgsklad' + (parseInt(item['№№']) < 10 ? parseInt(item['№№']) : item['№№'].padStart(3, '0'))
                    : `item${item['№№']}`);
                const img = document.createElement('img');
                img.className = 'thumbnail';
                img.setAttribute('data-prefix', prefix);
                img.setAttribute('loading', 'lazy');
                img.setAttribute('alt', item['Название'] || 'Изображение');
                const imageList = imageData[prefix] || [];
                img.src = imageList.length > 0 ? imageList[0] : 'img/placeholder.webp';
                td.appendChild(img);
            } else if (header === 'Оценка (агент TwoTables), за 1 шт.' && !isWarehousePage && !isSurveyPage && !isForSaleIkPage) {
                const cost = item[header] || 0;
                td.textContent = cost > 0 ? cost.toLocaleString('ru-RU') + ' ₽' : '';
                td.style.textAlign = 'right';
                const quantity = parseInt(item['Количество, шт.']) || 1;
                totalCost += cost * quantity;
            } else if (header === 'На продажу' && (isModernSofasPage || isSurveyPage || isForSaleIkPage)) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'for-sale';
                checkbox.checked = item['На продажу'] || false;
                checkbox.addEventListener('change', () => {
                    furnitureData[rowIndex]['На продажу'] = checkbox.checked;
                });
                td.appendChild(checkbox);
                td.style.textAlign = 'center';
            } else if (header === 'Ценный предмет' && (isModernSofasPage || isSurveyPage || isForSaleIkPage)) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'valuable';
                checkbox.checked = item['Ценный предмет'] || false;
                checkbox.addEventListener('change', () => {
                    furnitureData[rowIndex]['Ценный предмет'] = checkbox.checked;
                });
                td.appendChild(checkbox);
                td.style.textAlign = 'center';
            } else if (header === 'Пользовательская оценка' && !isModernSofasPage && !isSurveyPage && !isWarehousePage && !isForSaleIkPage) {
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

    // Добавление итоговой строки (только для страниц, кроме warehouse.html, survey.html и for_sale_ik.html)
    if (!isWarehousePage && !isSurveyPage && !isForSaleIkPage) {
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

    // Открытие модального окна для подтверждения (только для modern_sofas, survey и for_sale_ik)
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

    // Функция для отправки сообщения в Telegram через iframe
    async function sendTelegramMessage(message) {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.src = 'telegram-proxy.html';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.onload = () => {
                iframe.contentWindow.postMessage({ message }, 'https://gvantonov.github.io');
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve(true);
                }, 1000); // Даём время на отправку
            };
            iframe.onerror = () => {
                document.body.removeChild(iframe);
                reject(new Error('Ошибка загрузки telegram-proxy.html'));
            };
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

            let telegramSuccess = false;
            let firestoreSuccess = false;

            try {
                // Формирование сообщения для Telegram
                const moscowTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', hour12: false });
                const itemsWithSelection = furnitureData.filter(item => item['На продажу'] || item['Ценный предмет']);
                let telegramMessage = `🔔 Новые данные по ${isForSaleIkPage ? 'предложению ИК' : 'опросу (Modern Sofas + Warehouse)'} от ${userName}${userPhone ? ` (${userPhone})` : ''}\n`;
                telegramMessage += `Время (Москва): ${moscowTime}\n\n`;
                if (itemsWithSelection.length > 0) {
                    itemsWithSelection.forEach(item => {
                        telegramMessage += `- №: ${item['№№']}\n`;
                        telegramMessage += `  Наименование: ${item['Название'] || 'Не указано'}\n`;
                        telegramMessage += `  Источник: ${item['source'] === 'warehouse' ? 'Склад' : 'Modern Sofas'}\n`;
                        telegramMessage += `  На продажу: ${item['На продажу'] ? 'Да' : 'Нет'}\n`;
                        telegramMessage += `  Ценный предмет: ${item['Ценный предмет'] ? 'Да' : 'Нет'}\n\n`;
                    });
                } else {
                    telegramMessage += 'Нет выбранных предметов.\n';
                }

                // Разбиение сообщения на части, если оно слишком длинное
                const maxMessageLength = 4000;
                const messages = [];
                if (telegramMessage.length <= maxMessageLength) {
                    messages.push(telegramMessage);
                } else {
                    let currentMessage = `🔔 Новые данные по ${isForSaleIkPage ? 'предложению ИК' : 'опросу (Modern Sofas + Warehouse)'} от ${userName}${userPhone ? ` (${userPhone})` : ''}\n`;
                    currentMessage += `Время (Москва): ${moscowTime}\n\n`;
                    let currentLength = currentMessage.length;
                    let itemMessages = itemsWithSelection.map(item => {
                        return `- №: ${item['№№']}\n` +
                               `  Наименование: ${item['Название'] || 'Не указано'}\n` +
                               `  Источник: ${item['source'] === 'warehouse' ? 'Склад' : 'Modern Sofas'}\n` +
                               `  На продажу: ${item['На продажу'] ? 'Да' : 'Нет'}\n` +
                               `  Ценный предмет: ${item['Ценный предмет'] ? 'Да' : 'Нет'}\n\n`;
                    });

                    for (let itemMessage of itemMessages) {
                        if (currentLength + itemMessage.length <= maxMessageLength) {
                            currentMessage += itemMessage;
                            currentLength += itemMessage.length;
                        } else {
                            messages.push(currentMessage);
                            currentMessage = `🔔 Продолжение данных от ${userName}${userPhone ? ` (${userPhone})` : ''}\n\n` + itemMessage;
                            currentLength = currentMessage.length;
                        }
                    }
                    if (currentMessage.length > 0) {
                        messages.push(currentMessage);
                    }
                }

                // Отправка всех частей сообщения в Telegram
                for (let i = 0; i < messages.length; i++) {
                    if (messages[i].trim()) { // Проверяем, что сообщение не пустое
                        try {
                            await sendTelegramMessage(messages[i]);
                            console.log(`Telegram: Часть ${i + 1}/${messages.length} отправлена успешно`);
                            telegramSuccess = true;
                        } catch (error) {
                            console.error(`Telegram: Ошибка отправки части ${i + 1}:`, error);
                        }
                    }
                }

                // Сохранение в Firestore
                await addDoc(collection(db, 'survey_submissions'), {
                    userName: userName,
                    userPhone: userPhone,
                    data: furnitureData,
                    timestamp: new Date().toISOString()
                });
                console.log('Firestore: Данные сохранены успешно');
                firestoreSuccess = true;

                // Показываем сообщение об успехе, если хотя бы одна операция прошла
                if (telegramSuccess || firestoreSuccess) {
                    const modalContent = userInfoModal.querySelector('.modal-content');
                    modalContent.innerHTML = `
                        <span class="close">×</span>
                        <div class="success-message">
                            <p>Ваши данные успешно отправлены.</p>
                            <p>Если у вас есть дополнительные вопросы — напишите в WhatsApp</p>
                            <a href="http://wa.me/79153555202" target="_blank" class="whatsapp-link">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' class='whatsapp-icon'%3E%3Cpath fill='%2325D366' d='M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.218 1.617 6.042L0 24l6.058-1.587A11.947 11.947 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22.001c-1.874 0-3.627-.497-5.144-1.357l-.357-.212-3.6.943.961-3.518-.226-.37A9.956 9.956 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.618-4.943c-.308-.154-1.827-.904-2.11-.998-.282-.094-.488-.146-.694.146-.206.292-.798.998-.975 1.202-.177.204-.354.22-.652.073-.297-.147-1.254-.46-2.39-1.467-.883-.784-1.48-1.753-1.657-2.045-.177-.292-.018-.45.132-.596.135-.132.304-.346.456-.526.153-.18.206-.308.31-.518.103-.21.051-.394-.026-.553-.077-.16-.694-1.672-.952-2.29-.252-.598-.508-.517-.694-.517-.187 0-.399-.02-.611-.02-.212 0-.558.073-.852.368-.294.295-1.126 1.1-1.126 2.682 0 1.582 1.152 3.11 1.314 3.324.161.214 2.267 3.465 5.494 4.858.766.332 1.366.531 1.834.681.772.247 1.475.212 2.03.129.619-.094 1.827-.747 2.084-1.467.257-.72.257-1.34.18-1.467-.077-.127-.283-.201-.591-.355z'/%3E%3C/svg%3E" alt="WhatsApp" class="whatsapp-icon">
                                Написать
                            </a>
                        </div>
                    `;

                    // Обновляем обработчик для кнопки закрытия
                    const newCloseBtn = modalContent.querySelector('.close');
                    newCloseBtn.addEventListener('click', () => {
                        userInfoModal.style.display = 'none';
                    });
                } else {
                    throw new Error('Ни одна операция не выполнена успешно');
                }

            } catch (error) {
                console.error('Ошибка сохранения:', error);
                console.log(JSON.stringify({ userName, userPhone, data: furnitureData }, null, 2));
                // Показываем ошибку только если обе операции не удались
                if (!telegramSuccess && !firestoreSuccess) {
                    alert('Ошибка при отправке данных. Пожалуйста, попробуйте снова или свяжитесь через WhatsApp.');
                }
            }
        });
    }

    if (userInfoCloseBtn) {
        userInfoCloseBtn.addEventListener('click', () => {
            userInfoModal.style.display = 'none';
        });
    }

    if (userInfoModal) {
        userInfoModal.addEventListener('click', (e) => {
            if (e.target === userInfoModal) {
                userInfoModal.style.display = 'none';
            }
        });
    }

    // Код для галереи
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumbnail => {
        const prefix = thumbnail.getAttribute('data-prefix');
        const imageList = imageData[prefix] || [];
        if (imageList && imageList.length > 0) {
            thumbnail.src = imageList[0];
        } else {
            thumbnail.src = 'img/placeholder.webp';
        }
    });

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            const prefix = thumbnail.getAttribute('data-prefix');
            images = imageData[prefix] || [];
            if (images.length === 0) return;
            currentIndex = 0;
            updateGallery();
            modal.style.display = 'flex';
        });
    });

    function updateGallery() {
        mainImage.src = images[currentIndex] || 'img/placeholder.webp';
        thumbnailGallery.innerHTML = '';
        if (images.length > 0) {
            thumbnailGallery.className = 'thumbnail-gallery'; // Убедимся, что класс применяется
            images.forEach((imgSrc, index) => {
                const img = document.createElement('img');
                img.src = imgSrc || 'img/placeholder.webp';
                img.className = 'thumbnail-gallery img';
                if (index === currentIndex) {
                    img.classList.add('active');
                }
                img.addEventListener('click', () => {
                    currentIndex = index;
                    updateGallery();
                });
                thumbnailGallery.appendChild(img);
            });
        }
        arrowLeft.style.display = images.length > 1 && currentIndex > 0 ? 'block' : 'none';
        arrowRight.style.display = images.length > 1 && currentIndex < images.length - 1 ? 'block' : 'none';
    }

    arrowLeft.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateGallery();
        }
    });

    arrowRight.addEventListener('click', () => {
        if (currentIndex < images.length - 1) {
            currentIndex++;
            updateGallery();
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    fullscreenBtn.addEventListener('click', () => {
        if (mainImage.requestFullscreen) {
            mainImage.requestFullscreen();
        } else if (mainImage.mozRequestFullScreen) {
            mainImage.mozRequestFullScreen();
        } else if (mainImage.webkitRequestFullscreen) {
            mainImage.webkitRequestFullscreen();
        } else if (mainImage.msRequestFullscreen) {
            mainImage.msRequestFullscreen();
        }
    });

    // Динамическое выделение активной вкладки
    const currentPath = window.location.pathname.split('/').pop();
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        const href = tab.getAttribute('href');
        const tabPath = href.split('/').pop().split('?')[0]; // Учитываем только имя файла

        if (currentPath === tabPath) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
});