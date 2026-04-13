# Сервер и домен (olala-flowers.ru)

Внутренние заметки по развёртыванию. Пароли и приватные ключи в репозиторий не коммитить.

---

## 1. Домен в Reg.ru

| Что | Значение |
|-----|----------|
| Домен | **olala-flowers.ru** |
| DNS-серверы | `ns1.reg.ru`, `ns2.reg.ru` |
| Запись **A** `@` | публичный IP VPS (у нас **213.171.29.225**) |
| Запись **A** `www` | тот же IP |

Проверка: `nslookup olala-flowers.ru` → ожидается IP VPS. Глобально: [dnschecker.org](https://dnschecker.org).

**Заметка:** сообщение Reg.ru «домен не подключён к сайту» часто шаблонное; если **A**-записи верны и dnschecker зелёный — зона в порядке.

**Если домашний роутер отвечает «Non-existent domain», а `nslookup … 8.8.8.8` показывает IP** — кэш/резолвер провайдера; временно DNS на ПК **8.8.8.8** / **1.1.1.1** или ждать / перезагрузить роутер.

---

## 2. VPS Cloud.ru — доступ по SSH

| Поле | Значение |
|------|----------|
| Публичный IP | **213.171.29.225** (проверять в панели) |
| Пользователь | **`admin`** |
| Вход | SSH-ключ в `~/.ssh/authorized_keys` |

```text
ssh admin@213.171.29.225
```

С другого ПК: скопировать пару `id_ed25519` + `id_ed25519.pub` или добавить новый `.pub` на сервер.

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

---

## 8. Обновление кода с GitHub

```bash
cd /var/www/olala
git pull origin main
npm ci
npm run build
pm2 restart olala
```

---

## 9. Диагностика (кратко)

| Симптом | Куда смотреть |
|---------|----------------|
| Таймаут в браузере, с ПК **TcpTestSucceeded False** на **443** | Группа безопасности Cloud.ru: **привязка** к ВМ, правила **80/443** |
| «Не найден сервер» / DNS | Роутер, DNS **8.8.8.8**, dnschecker |
| С сервера **200**, снаружи нет | Почти всегда **облачный фаервол**, не Nginx |
| В `access.log` **404** на `GET /`, User-Agent `-` | Бот/запрос без `Host`; не путать с обычным браузером |

---

## 10. Если снова `Permission denied (publickey)` (SSH)

Проверить `~admin/.ssh/authorized_keys`, права **700** на `.ssh`, **600** на `authorized_keys`. Диагностика: `ssh -v admin@213.171.29.225`.
