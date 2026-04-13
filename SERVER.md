# Сервер и домен

Внутренние заметки по развёртыванию. Пароли и приватные ключи в репозиторий не коммитить.

## Домен **olala-flowers.ru** — сделано

| Что | Значение |
|-----|----------|
| DNS-серверы Reg.ru | `ns1.reg.ru`, `ns2.reg.ru` |
| Запись **A** `@` | `213.171.29.225` |
| Запись **A** `www` | `213.171.29.225` |
| TTL / SOA | по умолчанию в Reg.ru |

Проверка с компьютера (когда обновится DNS по миру):

```text
nslookup olala-flowers.ru
nslookup www.olala-flowers.ru
```

Ожидается ответ с **213.171.29.225**. Распространение — от минут до суток ([dnschecker.org](https://dnschecker.org)).

---

## VPS Cloud.ru — доступ

| Поле | Значение |
|------|----------|
| Публичный IP | **213.171.29.225** |
| Пользователь SSH | **`admin`** |
| Вход | по ключу `~/.ssh/id_ed25519` (настроено) |

Подключение:

```text
ssh admin@213.171.29.225
```

### С другого компьютера

- Скопировать пару `id_ed25519` + `id_ed25519.pub` в `\.ssh\` этого ПК, либо сгенерировать новую пару и **добавить** строку из `.pub` в `~admin/.ssh/authorized_keys` на сервере (через уже работающий SSH или веб-консоль).

---

## Развёртывание сайта (Next.js) — по этапам

Дальше делать по порядку; после каждого этапа можно отметить галочкой.

### Этап 1 — убедиться, что домен смотрит на сервер

На своём ПК, когда DNS дошёл: `nslookup olala-flowers.ru` → **213.171.29.225**. Если ещё старый IP — подождать или проверить зону в Reg.ru.

### Этап 2 — firewall на VPS (UFW + панель Cloud.ru)

**На сервере** (под `admin`, один раз):

```bash
sudo apt update
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

В **панели Cloud.ru** у ВМ проверьте группу безопасности: входящие **22, 80, 443** с `0.0.0.0/0` (или нужных сетей).

### Этап 3–4 — Node, репозиторий, сборка, PM2

Репозиторий: **`https://github.com/DGersmv/olala`**

### Где лежат сайты на сервере

Общий корень: **`/var/www/`**. У каждого проекта — **своя папка** с коротким именем (как на диске, без привязки к домену в названии):

| Каталог | Назначение (пример) |
|---------|---------------------|
| **`/var/www/olala`** | Этот сайт (olala-flowers.ru) |
| **`/var/www/227info`** | Другой проект, когда появится |
| **`/var/www/…`** | Остальные сайты так же |

Дальше для каждого сайта: свой `git clone`, свой `npm run build`, отдельный процесс в **PM2** (разные имена, например `olala` и `info227`), отдельный **server** / `server_name` в Nginx и свой SSL в certbot.

Первый раз для каталога:

```bash
sudo mkdir -p /var/www/olala
sudo chown -R "$USER:$USER" /var/www/olala
```

После `chown` пользователю `admin` не нужен `sudo` для `git` и `npm` внутри `/var/www/olala`.

**1) Node.js 22.x и git** (NodeSource, подходит для Next.js 16):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
node -v
npm -v
```

**2) Каталог и клон с GitHub**

Пароль от аккаунта GitHub для `git clone` по **HTTPS** **не подходит** — GitHub требует [Personal Access Token](https://github.com/settings/tokens) вместо пароля или вход по **SSH**. На сервере удобнее **SSH-ключ**.

##### SSH-ключ только для GitHub (на сервере, один раз)

```bash
ssh-keygen -t ed25519 -C "deploy-olala-vps" -f ~/.ssh/id_ed25519_github -N ""
cat ~/.ssh/id_ed25519_github.pub
```

Скопируйте **одну строку** вывода (от `ssh-ed25519` до конца). На GitHub:

- **Вариант А:** [SSH keys в профиле](https://github.com/settings/keys) → **New SSH key** — ключ с этого сервера будет работать для **всех** ваших репозиториев.
- **Вариант Б:** репозиторий **olala** → **Settings** → **Deploy keys** → **Add deploy key** — ключ только для **этого** репозитория (удобно для продакшена).

Затем конфиг и проверка:

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

Должно быть сообщение вроде: `Hi DGersmv! You've successfully authenticated...`

Клонирование по **SSH**:

```bash
cd /var/www/olala
git clone git@github.com:DGersmv/olala.git .
```

##### Если нужен именно HTTPS

Создайте токен: GitHub → **Settings** → **Developer settings** → **Personal access tokens** → доступ к репо. При `git clone` в качестве пароля вставьте **токен**, не пароль от сайта.

**3) Сборка:**

```bash
cd /var/www/olala
npm ci
npm run build
```

**4) PM2** — держит `next start` в фоне и перезапускает при ребуте:

```bash
sudo npm install -g pm2
cd /var/www/olala
pm2 start npm --name olala -- start
pm2 save
pm2 startup
```

Последняя команда выведет строку с `sudo env PATH=...` — **скопируйте и выполните её** (один раз), чтобы PM2 поднимался после перезагрузки.

Проверка: с сервера `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000` — ожидается **200**.

Пока **нет Nginx**, сайт с интернета на порт **3000** лучше не открывать; снаружи будут **80/443** после этапа 5.

### Этап 5 — Nginx и HTTPS

Когда **DNS** уже отдаёт **213.171.29.225** на `olala-flowers.ru`:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Конфиг Nginx (прокси на приложение PM2 на `127.0.0.1:3000`), затем:

```bash
sudo certbot --nginx -d olala-flowers.ru -d www.olala-flowers.ru
```

Certbot сам поправит конфиг под HTTPS и редирект HTTP→HTTPS.

---

## Если снова `Permission denied (publickey)`

Сервер принимает только ключ: проверить, что в `~admin/.ssh/authorized_keys` есть строка из вашего `id_ed25519.pub`, права `700` на `.ssh` и `600` на `authorized_keys`. Диагностика: `ssh -v admin@213.171.29.225`.
