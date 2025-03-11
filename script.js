// Импорт Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Конфигурация Firebase (замените на вашу)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "furniture-catalog.firebaseapp.com",
    projectId: "furniture-catalog",
    storageBucket: "furniture-catalog.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    const userInfoModal = document.getElementById('userInfoModal');
    const userInfoForm = document.getElementById('userInfoForm');
    const userInfoCloseBtn = userInfoModal.querySelector('.close');
    let currentIndex = 0;
    let images = [];

    // Загрузка furniture_catalog.json
    let furnitureData = [];
    try {
        const response = await fetch('furniture_catalog.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        furnitureData = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки furniture_catalog.json:', error);
        return;
    }

    // Загрузка images.json (для галереи)
    let imageData = {};
    try {
        const response = await fetch('images.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        imageData = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки images.json:', error);
        return;
    }

    // Динамическое создание заголовков
    const headers = Object.keys(furnitureData[0]).filter(header => header !== 'data-prefix');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Заполнение таблицы данными
    let totalCost = 0;
    furnitureData.forEach((item, rowIndex) => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            if (header === 'Фото') {
                const prefix = item['data-prefix'] || `item${item['№№']}`; // Гарантируем наличие prefix
                const img = document.createElement('img');
                img.className = 'thumbnail';
                img.setAttribute('data-prefix', prefix);
                img.setAttribute('loading', 'lazy');
                img.setAttribute('alt', item['Название'] || 'Изображение');
                const imageList = imageData[prefix] || [];
                img.src = imageList.length > 0 ? imageList[0] : 'img/placeholder.webp';
                td.appendChild(img);
            } else if (header === 'Оценка (агент TwoTables), за 1 шт.') {
                const cost = item[header] || 0;
                td.textContent = cost > 0 ? cost.toLocaleString('ru-RU') + ' ₽' : '';
                td.style.textAlign = 'right';
                const quantity = parseInt(item['Количество, шт.']) || 1;
                totalCost += cost * quantity;
            } else if (header === 'Пользовательская оценка') {
                td.className = 'editable';
                td.setAttribute('contenteditable', 'true');
                td.textContent = item[header] || '';
                td.style.textAlign = 'right';
                td.addEventListener('input', (e) => {
                    furnitureData[rowIndex][header] = e.target.textContent;
                });
            } else {
                td.textContent = item[header] || '';
                if (header === '№№' || header === 'Количество, шт.') {
                    td.style.textAlign = 'right';
                }
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    // Добавление итоговой строки
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
    totalRow.appendChild(totalValueCell); // Исправлено: добавляем totalValueCell в totalRow
    tfoot.appendChild(totalRow);

    // Открытие модального окна для ввода данных пользователя
    saveButton.addEventListener('click', () => {
        userInfoModal.style.display = 'flex';
    });

    // Сохранение данных после ввода имени и телефона
    userInfoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userName = document.getElementById('userName').value.trim();
        const userPhone = document.getElementById('userPhone').value.trim();
        if (!userName) {
            alert('Пожалуйста, введите ваше имя.');
            return;
        }
        try {
            const submissionData = {
                userName: userName,
                userPhone: userPhone,
                data: furnitureData,
                timestamp: new Date().toISOString()
            };
            await setDoc(doc(db, 'furniture', `submission_${Date.now()}`), submissionData);
            alert('Данные успешно сохранены!');
            userInfoModal.style.display = 'none';
            userInfoForm.reset();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении данных. Данные выведены в консоль.');
            console.log(JSON.stringify({ userName, userPhone, data: furnitureData }, null, 2));
        }
    });

    userInfoCloseBtn.addEventListener('click', () => {
        userInfoModal.style.display = 'none';
    });

    userInfoModal.addEventListener('click', (e) => {
        if (e.target === userInfoModal) {
            userInfoModal.style.display = 'none';
        }
    });

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
        mainImage.src = images[currentIndex];
        thumbnailGallery.innerHTML = '';
        images.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            if (index === currentIndex) {
                img.classList.add('active');
            }
            img.addEventListener('click', () => {
                currentIndex = index;
                updateGallery();
            });
            thumbnailGallery.appendChild(img);
        });
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
});
