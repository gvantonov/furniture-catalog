#!/bin/bash

# Указываем абсолютный путь к папке с изображениями
IMG_DIR="/Users/glebantonov/Documents/GitHub/furniture-catalog/img"

# Создаём временный файл для JSON
TEMP_FILE="temp_images.json"
OUTPUT_FILE="images.json"

# Проверяем, существует ли папка
if [ ! -d "$IMG_DIR" ]; then
    echo "Ошибка: Папка $IMG_DIR не найдена!"
    exit 1
fi

# Начало JSON
echo "{" > "$TEMP_FILE"

# Находим все файлы .webp и группируем их по префиксу (itemX)
find "$IMG_DIR" -type f -name "*.webp" | sort | while read -r file; do
    # Извлекаем имя файла без пути и расширения (например, item5-1)
    base_name=$(basename "$file" .webp)
    # Извлекаем префикс (например, item5)
    prefix=$(echo "$base_name" | sed 's/-[0-9]*$//')
    # Формируем относительный путь для JSON (img/itemX-Y.webp)
    rel_path="img/$base_name.webp"

    # Добавляем запись в JSON
    if grep -q "\"$prefix\"" "$TEMP_FILE"; then
        # Если префикс уже есть, добавляем новый элемент в массив
        sed -i '' "/\"$prefix\": \[/ s/\]/, \"$rel_path\"\]/" "$TEMP_FILE"
    else
        # Если префикса нет, создаём новую запись
        echo "  \"$prefix\": [\"$rel_path\"]," >> "$TEMP_FILE"
    fi
done

# Удаляем последнюю запятую (для валидного JSON)
sed -i '' '$ s/,$//' "$TEMP_FILE"

# Завершаем JSON
echo "}" >> "$TEMP_FILE"

# Перемещаем временный файл в итоговый
mv "$TEMP_FILE" "$OUTPUT_FILE"

echo "Файл $OUTPUT_FILE успешно создан в текущей директории!"
