#!/bin/bash

# Указываем абсолютный путь к папке с изображениями
IMG_DIR="/Users/glebantonov/Documents/GitHub/furniture-catalog/img"

# Создаём итоговый файл для JSON
OUTPUT_FILE="images.json"

# Проверяем, существует ли папка
if [ ! -d "$IMG_DIR" ]; then
    echo "Ошибка: Папка $IMG_DIR не найдена!"
    exit 1
fi

# Используем awk для создания JSON
find "$IMG_DIR" -type f -name "item*.webp" | sort | awk '
BEGIN {
    print "{"
}
{
    # Извлекаем имя файла (например, item10001.webp)
    base_name = substr($0, length("'"$IMG_DIR"'") + 2)
    # Извлекаем префикс (item100, item2 и т.д.), убираем последние 2 цифры
    prefix = substr(base_name, 1, match(base_name, /[0-9]{2}\.webp$/)-1)
    # Формируем путь (img/item10001.webp)
    rel_path = "img/" base_name

    # Сохраняем файлы в массиве по префиксу
    if (prefix in files) {
        files[prefix] = files[prefix] ", \"" rel_path "\""
    } else {
        files[prefix] = "\"" rel_path "\""
        prefixes[prefix] = prefix
    }
}
END {
    # Выводим все записи в формате JSON
    for (i = 1; i <= length(prefixes); i++) {
        prefix = prefixes["item" i]
        if (prefix) {
            printf "  \"%s\": [%s],\n", prefix, files[prefix]
        }
    }
    # Последний элемент без запятой
    for (prefix in prefixes) {
        if (!(prefix ~ /^item[0-9]+$/)) {
            printf "  \"%s\": [%s]\n", prefix, files[prefix]
        }
    }
    print "}"
}' > "$OUTPUT_FILE"

echo "Файл $OUTPUT_FILE успешно создан в текущей директории!"