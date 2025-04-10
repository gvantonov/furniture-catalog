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
    'modern_sofas': ['80', '61', '42', '41', '36', '35', '26', '7', '4', '3', '2', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79'] // Объединяем "Современная (атрибуция)" и "Диваны"
};

// Получение категории из URL
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category') || 'all';

// Проверка, является ли текущая страница modern_sofas
const isModernSofasPage = category === 'modern_sofas';

document.addEventListener('DOMContentLoaded', function () {
    var table = document.getElementById('furnitureTable');
    var thead = document.getElementById('tableHeader');
    var tbody = document.getElementById('tableBody');
    var modal = document.getElementById('galleryModal');
    var mainImage = document.getElementById('mainImage');
    var thumbnailGallery = document.getElementById('thumbnailGallery');
    var closeBtn = document.querySelector('.close');
    var arrowLeft = document.getElementById('arrowLeft');
    var arrowRight = document.getElementById('arrowRight');
    var fullscreenBtn = document.getElementById('fullscreenBtn');
    var currentIndex = 0;
    var images = [];

    // Определяем, на какой странице мы находимся
    var currentPage = window.location.pathname.split('/').pop();
    var isWarehousePage = currentPage === 'warehouse.html';

    // Загрузка данных
    var furnitureData = [];
    var imageData = {};

    // Функция для загрузки JSON
    function fetchJson(url, errorMessage) {
        return fetch(url)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(errorMessage + ' status: ' + response.status);
                }
                return response.json();
            });
    }

    // Загружаем данные в зависимости от страницы
    if (isWarehousePage) {
        // Для warehouse.html загружаем warehouse_data.json и warehouse_images.json
        fetchJson('warehouse_data.json', 'Ошибка загрузки warehouse_data.json:')
            .then(function (data) {
                furnitureData = data;
                return fetchJson('warehouse_images.json', 'Ошибка загрузки warehouse_images.json:');
            })
            .then(function (data) {
                imageData = data;
                renderTable();
            })
            .catch(function (error) {
                console.error(error);
                renderTable(); // Рендерим таблицу даже при ошибке загрузки изображений
            });
    } else {
        // Для остальных страниц загружаем furniture_catalog.json и images.json
        fetchJson('furniture_catalog.json', 'Ошибка загрузки furniture_catalog.json:')
            .then(function (data) {
                furnitureData = data;
                return fetchJson('images.json', 'Ошибка загрузки images.json:');
            })
            .then(function (data) {
                imageData = data;
                // Фильтрация данных по категории (для страниц с параметром category)
                var urlParams = new URLSearchParams(window.location.search);
                var category = urlParams.get('category');
                if (category) {
                    furnitureData = furnitureData.filter(function (item) {
                        return item['Категория'] === category;
                    });
                }
                renderTable();
            })
            .catch(function (error) {
                console.error(error);
                renderTable(); // Рендерим таблицу даже при ошибке загрузки изображений
            });
    }

    // Функция для рендеринга таблицы
    function renderTable() {
        // Динамическое создание заголовков
        var headers = [];
        if (isWarehousePage) {
            headers = ['№', 'Название', 'Фото'];
        } else {
            headers = ['№', 'Название', 'Категория', 'Цена', 'Статус', 'Фото'];
        }

        var headerRow = document.createElement('tr');
        headers.forEach(function (header) {
            var th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Заполнение таблицы данными
        furnitureData.forEach(function (item) {
            var row = document.createElement('tr');
            headers.forEach(function (header) {
                var td = document.createElement('td');
                td.setAttribute('data-label', header);
                if (header === '№') {
                    td.textContent = item['№'];
                    td.style.textAlign = 'right';
                } else if (header === 'Название') {
                    td.textContent = item['Название'];
                } else if (header === 'Категория' && !isWarehousePage) {
                    td.textContent = item['Категория'];
                } else if (header === 'Цена' && !isWarehousePage) {
                    td.textContent = item['Цена'];
                } else if (header === 'Статус' && !isWarehousePage) {
                    td.textContent = item['Статус'];
                } else if (header === 'Фото') {
                    var prefix = isWarehousePage
                        ? 'imgsklad' + (parseInt(item['№']) < 10 ? parseInt(item['№']) : item['№'].padStart(3, '0'))
                        : 'item' + item['№'];
                    var img = document.createElement('img');
                    img.className = 'thumbnail';
                    img.setAttribute('data-prefix', prefix);
                    img.setAttribute('loading', 'lazy');
                    img.setAttribute('alt', item['Название'] || 'Изображение');
                    var imageList = imageData[prefix] || [];
                    img.src = imageList.length > 0 ? imageList[0] : 'img/placeholder.webp';
                    td.appendChild(img);
                }
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        // Код для галереи
        var thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach(function (thumbnail) {
            var prefix = thumbnail.getAttribute('data-prefix');
            var imageList = imageData[prefix] || [];
            if (imageList && imageList.length > 0) {
                thumbnail.src = imageList[0];
            } else {
                thumbnail.src = 'img/placeholder.webp';
            }
        });

        thumbnails.forEach(function (thumbnail) {
            thumbnail.addEventListener('click', function () {
                var prefix = thumbnail.getAttribute('data-prefix');
                images = imageData[prefix] || [];
                if (images.length === 0) return;
                currentIndex = 0;
                updateGallery();
                modal.style.display = 'flex';
            });
        });
    }

    function updateGallery() {
        mainImage.src = images[currentIndex];
        thumbnailGallery.innerHTML = '';
        images.forEach(function (imgSrc, index) {
            var img = document.createElement('img');
            img.src = imgSrc;
            if (index === currentIndex) {
                img.classList.add('active');
            }
            img.addEventListener('click', function () {
                currentIndex = index;
                updateGallery();
            });
            thumbnailGallery.appendChild(img);
        });
        arrowLeft.style.display = images.length > 1 && currentIndex > 0 ? 'block' : 'none';
        arrowRight.style.display = images.length > 1 && currentIndex < images.length - 1 ? 'block' : 'none';
    }

    arrowLeft.addEventListener('click', function () {
        if (currentIndex > 0) {
            currentIndex--;
            updateGallery();
        }
    });

    arrowRight.addEventListener('click', function () {
        if (currentIndex < images.length - 1) {
            currentIndex++;
            updateGallery();
        }
    });

    closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    fullscreenBtn.addEventListener('click', function () {
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