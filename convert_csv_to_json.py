import csv
import json

# Читаем CSV и преобразуем в JSON
csv_file = 'furniture_catalog.csv'
json_file = 'furniture_catalog.json'

data = []
with open(csv_file, 'r', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=';')
    # Нормализуем заголовки, заменяя неразрывные пробелы и лишние пробелы
    fieldnames = [field.strip().replace('\xa0', ' ') for field in reader.fieldnames]
    print(f"Обнаруженные заголовки: {fieldnames}")  # Логирование заголовков для отладки
    
    for row in reader:
        normalized_row = {fieldnames[i]: value.strip() if value else '' for i, value in enumerate(row.values())}
        # Пропускаем строку с итоговой стоимостью (пустой №№)
        if not normalized_row['№№']:
            print(f"Пропущена строка с пустым №№: {normalized_row}")
            continue
        
        # Генерируем data-prefix на основе №№, если Фото пустое
        normalized_row['data-prefix'] = f'item{normalized_row["№№"]}'  # Упрощаем, используя только №№
        
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
        print(f"Обработана строка: {normalized_row}")  # Логирование каждой строки

# Сортируем ключи для нужного порядка столбцов
ordered_data = []
desired_order = [
    '№№', 'Фото', 'Название', 'Категория', 'Количество, шт.', 'Размеры (ВхШхГ)',
    'Материалы', 'Наименование', 'Заметки', 'Гарнитур',
    'Оценка (агент TwoTables), за 1 шт.', 'Пользовательская оценка', 'data-prefix'
]
for row in data:
    ordered_row = {key: row[key] for key in desired_order if key in row}
    ordered_data.append(ordered_row)

# Сохраняем в JSON
with open(json_file, 'w', encoding='utf-8') as jsonfile:
    json.dump(ordered_data, jsonfile, ensure_ascii=False, indent=4)

print(f"Файл {json_file} успешно создан с {len(ordered_data)} записями!")