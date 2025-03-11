// Импорт Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Конфигурация Firebase (замените на вашу)
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
            console.warn('Файл images.json не найден или пуст. Используются заглушки.');
            imageData = {}; // Заглушка, если файл отсутствует
        } else {
            imageData = await response.json();
        }
    } catch (error) {
        console.error('Ошибка загрузки images.json:', error);
        imageData = {}; // Заглушка при ошибке
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
                const prefix = item['data-prefix'] || `item${item['№№']}`;
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
    totalRow.appendChild(totalValueCell);
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

        if (!db) {
            alert('Firebase не инициализирован. Проверьте конфигурацию.');
            console.error('Firestore не доступен.');
            return;
        }

        try {
            console.log('Отправка данных:', { userName, userPhone, data: furnitureData });
            const submissionData = {
                userName: userName,
                userPhone: userPhone,
                data: furnitureData,
                timestamp: new Date().toISOString()
            };
            await setDoc(doc(db, 'furniture', `submission_${Date.now()}`), submissionData);

            // Заменяем содержимое модального окна на сообщение об успешной отправке
            const modalContent = userInfoModal.querySelector('.modal-content');
            modalContent.innerHTML = `
                <span class="close">×</span>
                <div class="success-message">
                    <p>Ваше предложение по стоимости направлено продавцу.</p>
                    <p>Если у вас есть дополнительные вопросы — напишите в WhatsApp</p>
                    <a href="http://wa.me/79153555202" target="_blank" class="whatsapp-link">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' class='whatsapp-icon'%3E%3Cpath fill='%2325D366' d='M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.218 1.617 6.042L0 24l6.058-1.587A11.947 11.947 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22.001c-1.874 0-3.627-.497-5.144-1.357l-.357-.212-3.6.943.961-3.518-.226-.37A9.956 9.956 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.618-4.943c-.308-.154-1.827-.904-2.11-.998-.282-.094-.488-.146-.694.146-.206.292-.798.998-.975 1.202-.177.204-.354.22-.652.073-.297-.147-1.254-.46-2.39-1.467-.883-.784-1.48-1.753-1.657-2.045-.177-.292-.018-.45.132-.596.135-.132.304-.346.456-.526.153-.18.206-.308.31-.518.103-.21.051-.394-.026-.553-.077-.16-.694-1.672-.952-2.29-.252-.598-.508-.517-.694-.517-.187 0-.399-.02-.611-.02-.212 0-.558.073-.852.368-.294.295-1.126 1.1-1.126 2.682 0 1.582 1.152 3.11 1.314 3.324.161.214 2.267 3.465 5.494 4.858.766.332 1.366.531 1.834.681.772.247 1.475.212 2.03.129.619-.094 1.827-.747 2.084-1.467.257-.72.257-1.34.18-1.467-.077-.127-.283-.201-.591-.355z'/%3E%3C/svg%3E" alt="WhatsApp" class="whatsapp-icon">
                        Написать
                    </a>
                </div>
            `;

            // Обновляем обработчик для кнопки закрытия, так как содержимое изменилось
            const newCloseBtn = modalContent.querySelector('.close');
            newCloseBtn.addEventListener('click', () => {
                userInfoModal.style.display = 'none';
            });
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
