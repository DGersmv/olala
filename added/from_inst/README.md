# Instagram → локальный каталог (фаза 1)

Сюда складываем фото и видео из Highlights магазина, разбитые по ценам как в Instagram.

Папка `added/` в git не коммитится целиком — только эта инструкция и пустые `.gitkeep`.

## Структура

| Папка | Ценовой диапазон |
|-------|------------------|
| `1000-1500/` | 1 000 – 1 500 ₽ |
| `1800-2000/` | 1 800 – 2 000 ₽ |
| `2500-2800/` | 2 500 – 2 800 ₽ |
| `3500-4000/` | 3 500 – 4 000 ₽ |
| `4000-4300/` | 4 000 – 4 300 ₽ |
| `6500-7500/` | 6 500 – 7 500 ₽ |
| `9000-10000/` | 9 000 – 10 000 ₽ |
| `15000-17000/` | 15 000 – 17 000 ₽ |
| `20000-25000/` | 20 000 – 25 000 ₽ |
| `_raw/` | временно: сюда instaloader кладёт Highlights как есть |
| `_unmatched/` | слайды, для которых не угадали ценовую папку |

Создать папки заново:

```bash
npm run setup:from-inst
```

## Способ 1 — вручную

1. Откройте профиль: https://www.instagram.com/olalaflower/
2. Зайдите в Highlight с нужным диапазоном цен.
3. Сохраните каждый слайд в соответствующую папку здесь.

## Способ 2 — Instaloader через прокси (рекомендуется)

Профиль: **olalaflower**. Прокси — те же переменные, что для ленты на сайте (`INSTAGRAM_PROXY_*` в `.env.local`).

Добавьте в `.env.local` (файл не коммитится):

```env
INSTAGRAM_USERNAME=olalaflower
INSTAGRAM_PROXY_HOST=185.166.199.226
INSTAGRAM_PROXY_PORT=8000
INSTAGRAM_PROXY_USER=ваш_логин
INSTAGRAM_PROXY_PASS=ваш_пароль
```

Скачать Highlights:

```bash
npm run download:from-inst
```

Или вручную в PowerShell (instaloader читает `HTTP_PROXY` / `HTTPS_PROXY`):

```powershell
$env:HTTPS_PROXY="http://USER:PASS@185.166.199.226:8000"
$env:HTTP_PROXY=$env:HTTPS_PROXY
python -m instaloader --dirname-pattern="added/from_inst/_raw/{highlight}" --title-pattern="{date_utc}_{shortcode}" --highlights olalaflower
```

> **Connection aborted с ПК:** прокси может работать для сайта на VPS, но Instagram иногда рвёт HTTPS с домашней сети. Тогда на сервере: `cd /var/www/olala`, скопируйте `.env.local`, `pip install instaloader`, `npm run download:from-inst`, затем `npm run sort:from-inst` и заберите папку `added/from_inst` на ПК.

Затем разложить по ценовым папкам:

```bash
npm run sort:from-inst
```

Скрипт сопоставляет **имя папки Highlight** с одной из 9 ценовых. Не попавшее — в `_unmatched/` (перенесите руками).

## Способ 3 — gallery-dl

```bash
gallery-dl -D added/from_inst/_raw https://www.instagram.com/olalaflower/
npm run sort:from-inst
```

## Проверка

Откройте каждую ценовую папку — внутри должны быть фото букетов из соответствующего Highlight.

## Дальше (фаза 2)

Когда все папки заполнены — перенесём контент в `public/catalog/` и соберём каталог на сайте.
