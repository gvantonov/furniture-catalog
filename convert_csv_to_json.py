import csv
import json

# Читаем CSV и преобразуем в JSON
csv_file = 'furniture_catalog.csv'
json_file = 'furniture_catalog.json'

data = []
with open(csv_file, 'r', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=';')
    # Выводим заголовки для отладки
    print("Заголовки столбцов:", reader.fieldnames)
    # Нормализуем заголовки, заменяя неразрывные пробелы и лишние пробелы
    fieldnames = [field.strip().replace('\xa0', ' ') for field in reader.fieldnames]
    print("Нормализованные заголовки:", fieldnames)
    # Создаём новый словарь с нормализованными ключами
    for row in reader:
        normalized_row = {fieldnames[i]: value for i, value in enumerate(row.values())}
        # Пропускаем строку с итоговой стоимостью (пустой №№)
        if not normalized_row['№№']:
            continue
        # Удаляем лишние пробелы и преобразуем в нужный формат
        for key in normalized_row:
            normalized_row[key] = normalized_row[key].strip() if normalized_row[key] else ''
        # Добавляем data-prefix для совместимости с галереей
        normalized_row['data-prefix'] = normalized_row.pop('Фото') or f'item{normalized_row["№№"]}'
        # Добавляем пустой столбец для пользовательской оценки
        normalized_row['Пользовательская оценка'] = ''
        # Преобразуем стоимость в число
        cost_key = 'Оценка (агент TwoTables), за 1 шт.'
        cost = normalized_row[cost_key]
        if cost:
            cost = cost.replace('₽', '').replace(' ', '').replace('\xa0', '')
            normalized_row[cost_key] = float(cost) if cost else 0
        else:
            normalized_row[cost_key] = 0
        data.append(normalized_row)

# Сохраняем в JSON
with open(json_file, 'w', encoding='utf-8') as jsonfile:
    json.dump(data, jsonfile, ensure_ascii=False, indent=4)

print(f"Файл {json_file} успешно создан!")

