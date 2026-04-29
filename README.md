# IPS Theme

Temă modernă pentru forumuri **Forumotion** (motor IPB/FA), cu design dark/light, toolbar custom, hovercard-uri de utilizator, sistem de lock cu parolă și îmbunătățiri vizuale ale index-ului.

---

## Structura repo

```
ips-theme/
├── styles.css        ← Un singur fișier CSS (variabile + toate stilurile)
├── utils.js          ← ColorUtils + IpsUtils (utilitare partajate)
├── ips-core.js       ← Statistici forum + Who is Online (data-core)
├── hovercard.js      ← Hovercard profil (desktop hover + mobile sheet)
├── toolbar.js        ← Bara de navigare fixă (notificări, mesaje, temă)
├── lock.js           ← Protecție categorii/pagini cu parolă SHA-256
└── forum-enhance.js  ← Grid subforumuri, empty state, last-post mascat
```

---

## Ordine de încărcare

Scripturile trebuie incluse în această ordine în template-ul Forumotion:

```html
<!-- 1. CSS — o singură dată, în <head> -->
<link rel="stylesheet" href="styles.css">

<!-- 2. Utilitare (fără dependințe externe) -->
<script src="utils.js"></script>

<!-- 3. Module (depind de utils.js) -->
<script src="ips-core.js"></script>
<script src="hovercard.js"></script>
<script src="toolbar.js"></script>
<script src="lock.js"></script>
<script src="forum-enhance.js"></script>
```

---

## styles.css

Un singur fișier care conține:

1. **CSS variables dark** — `:root, [data-ips-theme="dark"]` — variabile `--ips-*`, `--tb-*`, `--f-*`, `--notif-*`
2. **CSS variables light** — `[data-ips-theme="light"]`
3. **Stiluri componente** — toolbar, hovercard, forum index, subforum grid, lock overlay, footer, formulare

### Variabile cheie

| Variabilă | Rol |
|---|---|
| `--gc` | Group color (culoarea grupului utilizatorului curent) |
| `--gc-light` | Versiune mai deschisă a group color |
| `--gc-dim` | Versiune transparentă (18%) a group color |
| `--ips-bg` | Fundalul paginii |
| `--ips-surface` | Card/bloc principal |
| `--ips-elevated` | Header card, toolbar |
| `--ips-panel-bg` | Dropdown-uri, hovercard |
| `--ips-border` | Bordură standard |
| `--ips-text` | Text principal |
| `--ips-muted` | Text secundar |

Variabilele `--gc`, `--gc-light`, `--gc-dim` sunt setate dinamic în `toolbar.js` pe baza culorii grupului utilizatorului (`_userdata.groupcolor`).

---

## ips-core.js

Procesează elementele marcate cu `data-core` în template:

```html
<!-- Statistici forum -->
<div data-core="forum_stats_core">
  {TOTAL_POSTS} {TOTAL_USERS} {NEWEST_USER} {RECORD_USERS}
</div>

<!-- Online acum -->
<div data-core="forum_whois_online_core">
  {TOTAL_USERS_ONLINE} {LOGGED_IN_USER_LIST} {GROUP_LEGEND}
</div>
```

**Debug**: adaugă `?ips_debug=1` în URL pentru a vedea datele parsate.

---

## hovercard.js

Activare automată pe toate link-urile de tip `/uNUMER`.

- **Desktop**: hover → card flotant după 250ms
- **Mobile (touch)**: buton `i` lângă fiecare link → bottom sheet

Fără configurare necesară.

---

## toolbar.js

Construiește bara fixă de navigare. Citește datele din variabila globală `_userdata` furnizată de Forumotion.

Filtrare automată a link-urilor din `#submenu` (ascunde: Căutare, Grupuri, Profil, Mesagerie, Deconectare — acestea sunt disponibile în toolbar).

Redenumire automată:
- `Acasa` → `Forum`
- `Membri` → `Utilizatori`
- `Faq` → `Suport`

Tema dark/light este salvată în `localStorage` (`ips-theme`).

---

## lock.js

Protejează categorii sau pagini întregi cu o parolă verificată local (SHA-256, Web Crypto API). **Necesită HTTPS.**

### Configurare

```js
var LOCKS = {
  'c1': 'hash-sha256-al-parolei',   // ID categorie → hash
};

var URL_LOCKS = {
  '/f3': 'c1',   // URL prefix → ID categorie
};
```

### Generare hash

```js
// În consolă browser:
crypto.subtle.digest('SHA-256', new TextEncoder().encode('parola-ta'))
  .then(b => console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')));
```

### API public

```js
IpsLock.reset('c1');   // Resetează o categorie (cere parola din nou)
IpsLock.resetAll();    // Resetează toate categoriile
```

---

## forum-enhance.js

Îmbunătățiri vizuale automate la încărcarea paginii:

- **Grid subforumuri** — transformă lista de link-uri din `.ips-forum-subs` în carduri cu hover
- **Empty state** — forumuri fără postări primesc un placeholder vizual
- **Last-post mascat** — categoriile din `LOCKED_CATEGORIES` nu dezvăluie ultimul post

### Configurare

```js
var LOCKED_CATEGORIES = ['c1'];   // Sincronizat cu LOCKS din lock.js
var EMPTY_THRESHOLD = 0;          // Forumuri cu ≤ N subiecte = "gol"
```

---

## Personalizare group color

Group color-ul este setat automat din `_userdata.groupcolor` (hex fără `#`). Poți seta o valoare implicită modificând linia din `toolbar.js`:

```js
var gc    = '#' + (USER.groupcolor || '1B6AA7');
```

---

## Browser support

Chrome 80+, Firefox 75+, Safari 13.1+, Edge 80+

Web Crypto API (lock.js) necesită HTTPS sau `localhost`.
