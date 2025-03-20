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

# Проверяем, что find находит файлы (отладка)
echo "Найденные файлы:"
find "$IMG_DIR" -type f -name "item*.webp" | sort -V

# Используем awk для создания JSON с числовой сортировкой
find "$IMG_DIR" -type f -name "item*.webp" | sort -V | awk '
BEGIN {
    print "{"
    first = 1  # Флаг для корректного форматирования запятых
}
{
    # Извлекаем имя файла (например, item10001.webp)
    base_name = substr($0, length("'"$IMG_DIR"'") + 2)
    # Проверяем, что это файл item*.webp
    if (match(base_name, /item[0-9]+\.webp$/)) {
        # Извлекаем префикс (всё до последних двух цифр, если они есть)
        if (match(base_name, /[0-9]{2}\.webp$/)) {
            prefix = substr(base_name, 1, match(base_name, /[0-9]{2}\.webp$/) - 1)
        } else {
            prefix = substr(base_name, 1, match(base_name, /\.webp$/) - 1)
        }
        # Формируем путь (img/item10001.webp)
        rel_path = "img/" base_name

        # Извлекаем числовую часть для порядка
        num = substr(prefix, 5) + 0  # +0 превращает строку в число

        # Сохраняем файлы в массиве по префиксу
        if (prefix in files) {
            files[prefix] = files[prefix] ", \"" rel_path "\""
        } else {
            files[prefix] = "\"" rel_path "\""
            # Сохраняем префикс с числом для порядка
            if (!(num in order)) {
                order[num] = prefix
                num_order[n++] = num  # Сохраняем числа в порядке добавления
            }
        }
    }
}
END {
    # Выводим префиксы в числовом порядке
    for (i = 0; i < n; i++) {
        num = num_order[i]
        prefix = order[num]
        if (first) {
            first = 0
        } else {
            print ","
        }
        printf "  \"%s\": [%s]", prefix, files[prefix]
    }
    print "\n}"
}' > "$OUTPUT_FILE"

echo "Файл $OUTPUT_FILE успешно создан в текущей директории!"