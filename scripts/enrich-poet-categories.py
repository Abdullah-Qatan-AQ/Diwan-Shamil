import json
from pathlib import Path

path = Path('data/poetry/poets.json')
data = json.loads(path.read_text())
poets = data['poets']
explicit = {
    'إيليا أبو ماضي': ['الحديثون', 'شعراء المهجر'],
    'تأبط شراً': ['الصعاليك'],
    'الشنفرى': ['الصعاليك'],
    'عروة بن الورد': ['الصعاليك'],
    'السليك بن السلكة': ['الصعاليك'],
    'حاجز بن عوف': ['الصعاليك'],
}
for poet in poets:
    era = poet.get('eras', [''])[0]
    categories = []
    if era == 'العصر الجاهلي':
        categories += ['الجاهليون', 'القدماء']
    elif era == 'المخضرمون':
        categories += ['المخضرمون', 'القدماء']
    elif era == 'العصر الاسلامي':
        categories += ['صدر الإسلام', 'القدماء']
    elif era == 'العصر الاموي':
        categories += ['الأمويون', 'القدماء']
    elif era == 'العصر العباسي':
        categories += ['العباسيون', 'القدماء']
    elif era == 'العصر الأندلسي':
        categories += ['الأندلسيون', 'القدماء']
    elif era == 'العصر الايوبي':
        categories += ['الأيوبيون', 'القدماء']
    elif era == 'العصر المملوكي':
        categories += ['المماليك', 'القدماء']
    elif era == 'العصر العثماني':
        categories += ['العثمانيون', 'القدماء']
    categories += explicit.get(poet['name'], [])
    poet['categories'] = list(dict.fromkeys(categories))

existing = next((p for p in poets if p['name'] == 'إيليا أبو ماضي'), None)
if existing is None:
    poets.append({'name': 'إيليا أبو ماضي', 'count': 2, 'eras': ['العصر الحديث'], 'categories': ['الحديثون', 'شعراء المهجر']})
else:
    existing.update({'count': 2, 'eras': ['العصر الحديث'], 'categories': ['الحديثون', 'شعراء المهجر']})
data['count'] = len(poets)
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

index_path = Path('data/poetry/index.json')
index = json.loads(index_path.read_text())
index['count'] = 75024
index['poetCount'] = len(poets)
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
print(f'updated {len(poets)} poets')
