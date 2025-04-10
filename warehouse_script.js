document.addEventListener('DOMContentLoaded', async () => {
    const table = document.getElementById('furnitureTable');
    const thead = document.getElementById('tableHeader');
    const tbody = document.getElementById('tableBody');
    const modal = document.getElementById('galleryModal');
    const mainImage = document.getElementById('mainImage');
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    const closeBtn = document.querySelector('.close');
    const arrowLeft = document.getElementById('arrowLeft');
    const arrowRight = document.getElementById('arrowRight');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    let currentIndex = 0;
    let images = [];
    let warehouseData = [];

    // Загрузка данных из warehouse_data.json
    try {
        const response = await fetch('warehouse_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        warehouseData = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки warehouse_data.json:', error);
        return;
    }

    // Загрузка warehouse_images.json
    let imageData = {};
    try {
        const response = await fetch('warehouse_images.json');
        if (!response.ok) {
            console.warn('Файл warehouse_images.json не найден или пуст. Используются заглушки.');
            imageData = {};
        } else {
            imageData = await response.json();
        }
    } catch (error) {
        console.error('Ошибка загрузки warehouse_images.json:', error);
        imageData = {};
    }

    // Динамическое создание заголовков
    const headers = ['№', 'Название', 'Фото'];
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Заполнение таблицы данными
    warehouseData.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.setAttribute('data-label', header);
            if (header === '№') {
                td.textContent = item['№'];
                td.style.textAlign = 'right';
            } else if (header === 'Название') {
                td.textContent = item['Название'];
            } else if (header === 'Фото') {
                const itemNumber = parseInt(item['№'], 10);
                const prefix = `imgsklad${itemNumber < 10 ? itemNumber : itemNumber.toString().padStart(3, '0')}`;
                const img = document.createElement('img');
                img.className = 'thumbnail';
                img.setAttribute('data-prefix', prefix);
                img.setAttribute('loading', 'lazy');
                img.setAttribute('alt', item['Название'] || 'Изображение');
                const imageList = imageData[prefix] || [];
                if (imageList.length > 0) {
                    img.src = imageList[0];
                    console.log(`Загружаем фото для предмета ${item['№']}: ${imageList[0]}`); // Отладка
                } else {
                    img.src = '/img/placeholder.webp'; // Путь к заглушке
                    console.log(`Фото для предмета ${item['№']} не найдено, используется заглушка.`); // Отладка
                }
                td.appendChild(img);
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    // Код для галереи
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumbnail => {
        const prefix = thumbnail.getAttribute('data-prefix');
        const imageList = (imageData[prefix] || []).filter(url => {
            // Проверяем, существует ли изображение (асинхронно)
            return new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            });
        });
        if (imageList.length > 0) {
            thumbnail.src = imageList[0];
        } else {
            thumbnail.src = '/img/placeholder.webp';
        }
    });

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', async () => {
            const prefix = thumbnail.getAttribute('data-prefix');
            // Фильтруем только существующие изображения
            images = [];
            const allImages = imageData[prefix] || [];
            for (const url of allImages) {
                const exists = await new Promise((resolve) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                });
                if (exists) {
                    images.push(url);
                }
            }
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