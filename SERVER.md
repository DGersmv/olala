# Сервер и домен (olala-flowers.ru)

Внутренние заметки по развёртыванию. Пароли и приватные ключи в репозиторий не коммитить.

---

## 1. Домен в Reg.ru

| Что | Значение |
|-----|----------|
| Домен | **olala-flowers.ru** |
| DNS-серверы | `ns1.reg.ru`, `ns2.reg.ru` |
| Запись **A** `@` | публичный IP VPS (сейчас **192.144.13.78**, ВМ `olala-227`) |
| Запись **A** `www` | тот же IP |

Проверка: `nslookup olala-flowers.ru` → ожидается IP VPS. Глобально: [dnschecker.org](https://dnschecker.org).

**Заметка:** сообщение Reg.ru «домен не подключён к сайту» часто шаблонное; если **A**-записи верны и dnschecker зелёный — зона в порядке.

**Если домашний роутер отвечает «Non-existent domain», а `nslookup … 8.8.8.8` показывает IP** — кэш/резолвер провайдера; временно DNS на ПК **8.8.8.8** / **1.1.1.1** или ждать / перезагрузить роутер.

---

## 2. VPS Cloud.ru — доступ по SSH

| Поле | Значение |
|------|----------|
| Публичный IP | **192.144.13.78** (ВМ `olala-227`, id `c05db56a-ffbd-426d-b49f-38fc3a71f6bc`) |
| Пользователь | **`user1`** |
| SSH-ключ (локально) | `~/.ssh/id_ed25519_cloudru` |
| Вход | SSH-ключ в `~/.ssh/authorized_keys` |

```text
ssh -i ~/.ssh/id_ed25519_cloudru -o IdentitiesOnly=yes user1@192.144.13.78
```

Старая ВМ (**213.171.29.225**, пользователь `admin`) больше не используется для Olala — там могут остаться nordlab и другие сайты.

С другого ПК: скопировать пару `id_ed25519_cloudru` + `.pub` или добавить новый `.pub` на сервер.

---

## 3. Группа безопасности в Cloud.ru — **обязательно для веба**

**UFW на ВМ и открытые порты в Linux — недостаточны.** Трафик режется **ещё на уровне облака**, пока к сетевому интерфейсу ВМ не привязана группа с **входящими** правилами.

### Что сделать

1. Создать группу (например `sg-web-80-443`) в той же зоне, что и ВМ (**ru.AZ-1**).
2. **Входящий трафик:**
   - **TCP 80** — источник **0.0.0.0/0** (HTTP)
   - **TCP 443** — источник **0.0.0.0/0** (HTTPS)
3. **Исходящий трафик:** разрешить **всё** на **0.0.0.0/0** (или широко: DNS, обновления, `git`, certbot). **Не** ограничивать исходящий только портами 80/443 — сломается DNS и т.п.
4. Отдельная группа для **SSH** (например `SSH-access_ru.AZ-1`) с **TCP 22** — оставить как было.
5. **Привязать обе группы к виртуальной машине** (к сетевому интерфейсу ВМ). Пока у группы в разделе «Интерфейсы» пусто — правила **не действуют**.

### Симптом без привязки группы

- С сервера `curl https://olala-flowers.ru` — **200**, PM2 и Nginx в порядке.
- С домашнего ПК / LTE: **таймаут**, `Test-NetConnection IP -Port 443` → **TcpTestSucceeded : False**.

После привязки группы с **80/443** проверка с Windows: `Test-NetConnection 213.171.29.225 -Port 443` → **True**.

---

## 4. Firewall на самой ВМ (UFW)

```bash
sudo apt update
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

При запросе подтверждения лучше **`LANG=C sudo ufw enable`** и латинская **`y`**, иначе возможна ошибка кодировки в терминале.

---

## 5. Каталоги сайтов на диске

Корень: **`/var/www/`**. Один каталог — один проект:

| Путь | Проект |
|------|--------|
| `/var/www/olala` | этот сайт |
| `/var/www/227info` | пример следующего |

```bash
sudo mkdir -p /var/www/olala
sudo chown -R "$USER:$USER" /var/www/olala
```

Рабочий пользователь на `olala-227`: **`user1`**.

---

## 6. Node.js, GitHub по SSH, сборка, PM2

### Node и git

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
```

### Ключ для GitHub (HTTPS-пароль не подходит)

```bash
ssh-keygen -t ed25519 -C "deploy-olala-vps" -f ~/.ssh/id_ed25519_github -N ""
cat ~/.ssh/id_ed25519_github.pub
```

Строку из `.pub` добавить: **Deploy keys** репозитория или **SSH keys** профиля GitHub.

```bash
printf '%s\n' \
  'Host github.com' \
  '  HostName github.com' \
  '  User git' \
  '  IdentityFile ~/.ssh/id_ed25519_github' \
  '  IdentitiesOnly yes' \
  >> ~/.ssh/config
chmod 600 ~/.ssh/config
ssh -T git@github.com
```

### Клон и сборка

```bash
cd /var/www/olala
git clone git@github.com:DGersmv/olala.git .
npm ci
npm run build
```

### PM2

```bash
sudo npm install -g pm2
cd /var/www/olala
pm2 start npm --name olala -- start
pm2 save
pm2 startup
```

Выполнить выведенную команду `sudo env PATH=...` от `pm2 startup` (один раз).

Проверка приложения: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000` → **200**.

---

## 7. Nginx и Let’s Encrypt

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Базовый vhost: `proxy_pass http://127.0.0.1:3000;`, `server_name olala-flowers.ru www.olala-flowers.ru;`.

```bash
sudo certbot --nginx -d olala-flowers.ru -d www.olala-flowers.ru
```

### После certbot: упростить блок на порту 80

Certbot иногда оставляет конструкцию с **`if ($host = …)`** и в конце **`return 404`**. Тогда часть запросов получает **404** вместо редиректа на HTTPS.

**Заменить** второй `server { … }` для `listen 80` на:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name olala-flowers.ru www.olala-flowers.ru;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Проверка: `sudo ss -tlnp | grep nginx` — должны быть **0.0.0.0:80** и **0.0.0.0:443**.

Снаружи: `Test-NetConnection 192.144.13.78 -Port 443` → **True**. Если **False** при живом Nginx — не открыта/не привязана группа безопасности Cloud.ru (п. 3).

---

## 8. PostgreSQL (база Olala)

БД крутится **на том же VPS**, доступ только с localhost (`127.0.0.1:5432`).

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER olala WITH PASSWORD 'ВАШ_ПАРОЛЬ';"
sudo -u postgres psql -c "CREATE DATABASE olala OWNER olala;"
sudo -u postgres psql -d olala -f /var/www/olala/schema.sql
```

В `/var/www/olala/.env.local`:

```env
DATABASE_URL=postgresql://olala:ВАШ_ПАРОЛЬ@127.0.0.1:5432/olala
```

Проверка:

```bash
psql "$DATABASE_URL" -c "select count(*) from users;"
```

Бэкап (cron раз в сутки):

```bash
pg_dump postgresql://olala:ПАРОЛЬ@127.0.0.1:5432/olala > /var/backups/olala-$(date +%F).sql
```

---

## 9. Обновление кода с GitHub

```bash
cd /var/www/olala
git pull origin main
npm ci
npm run build
pm2 restart olala
```

---

## 10. Диагностика (кратко)

| Симптом | Куда смотреть |
|---------|----------------|
| Таймаут в браузере, с ПК **TcpTestSucceeded False** на **443** | Группа безопасности Cloud.ru: **привязка** к ВМ, правила **80/443** |
| «Не найден сервер» / DNS | Роутер, DNS **8.8.8.8**, dnschecker |
| С сервера **200**, снаружи нет | Почти всегда **облачный фаервол**, не Nginx |
| В `access.log` **404** на `GET /`, User-Agent `-` | Бот/запрос без `Host`; не путать с обычным браузером |

---

## 11. Если снова `Permission denied (publickey)` (SSH)

Проверить `~admin/.ssh/authorized_keys`, права **700** на `.ssh`, **600** на `authorized_keys`. Диагностика: `ssh -v admin@213.171.29.225`.
