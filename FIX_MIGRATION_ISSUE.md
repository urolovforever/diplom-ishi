# Migration va Database Muammolarini Hal Qilish

## 📋 Muammo

Siz `main` branchda ishlar ekan, migration fayllarni o'chirib yuborgansiz va hozir git xatoliklar bermoqda.

## ✅ Yechim (Qadamma-qadam)

### 1. Hozirgi vaziyatni tekshiring

```bash
git status
git branch
```

### 2. O'zgarishlarni bekor qiling (migration fayllarni qaytaring)

Agar siz migration fayllarni o'chirib yuborganingizda ular git dan restore qilinishi mumkin:

```bash
# O'chirilgan fayllarni git dan qaytarish
git restore backend/confessions/migrations/0001_initial.py
git restore backend/confessions/migrations/0002_post_views_count.py
git restore backend/confessions/migrations/0003_notification.py
git restore backend/confessions/migrations/0004_alter_comment_options_comment_is_edited_and_more.py
git restore backend/confessions/migrations/__init__.py

# Yoki barcha o'zgarishlarni bekor qilish
git restore backend/confessions/migrations/

# accounts migration ni ham qaytaring
git restore backend/accounts/migrations/0001_initial.py
```

### 3. __pycache__ fayllarni tozalang

```bash
# Barcha __pycache__ papkalarni o'chirish
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete
```

### 4. Database'ni o'chirib, qaytadan yarating

```bash
cd backend

# Eski database'ni o'chirish
rm -f db.sqlite3 db.sqlite3-journal

# Yangi database yaratish va migrationlarni apply qilish
python manage.py migrate

# Superuser yaratish (agar kerak bo'lsa)
python manage.py createsuperuser
```

### 5. To'g'ri branchga o'ting

Siz `main` branchda emas, `claude/fix-react-warnings-011CUrHBYEz5yDEvHnfd4vWm` branchida ishlashingiz kerak:

```bash
# To'g'ri branchga o'tish
git checkout claude/fix-react-warnings-011CUrHBYEz5yDEvHnfd4vWm

# Oxirgi o'zgarishlarni pull qilish
git pull origin claude/fix-react-warnings-011CUrHBYEz5yDEvHnfd4vWm
```

### 6. .gitignore tekshiring

`.gitignore` fayli allaqachon to'g'ri sozlangan va quyidagi qatorlar mavjud:

```
# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
media/

# Python
__pycache__/
*.py[cod]
```

Demak, `db.sqlite3` va `__pycache__` fayllar git dan ignore qilinadi.

## 🔴 MUHIM: Main Branch Muammosi

Agar `main` branchda ishlayotgan bo'lsangiz va u yerda konfessiyalar o'chirilgan bo'lsa:

**Variant 1: Main branchni to'liq reset qiling**
```bash
git checkout main
git fetch origin main
git reset --hard origin/main
```

**Variant 2: O'zgarishlarni bekor qiling**
```bash
git checkout main
git restore .
git clean -fd
```

**Variant 3: To'g'ri branchda ishlang**
```bash
# Claude branch'ga o'ting (tavsiya etiladi)
git checkout claude/fix-react-warnings-011CUrHBYEz5yDEvHnfd4vWm
git pull
```

## 📊 Kerakli Migration Fayllar

Backend confessions app uchun quyidagi migration fayllar bo'lishi kerak:

```
backend/confessions/migrations/
├── __init__.py
├── 0001_initial.py
├── 0002_post_views_count.py
├── 0003_notification.py
└── 0004_alter_comment_options_comment_is_edited_and_more.py
```

## 🚀 Barcha Narsani Boshidan Boshlash (Agar yuqoridagilar ishlamasa)

Agar hali ham muammolar bo'lsa, repository ni qaytadan clone qiling:

```bash
# Eski papkani o'chirish (ehtiyotkorlik bilan!)
cd ..
mv diplom-ishi diplom-ishi-backup

# Qaytadan clone qilish
git clone <repository-url> diplom-ishi
cd diplom-ishi

# To'g'ri branchga o'tish
git checkout claude/fix-react-warnings-011CUrHBYEz5yDEvHnfd4vWm

# Backend setup
cd backend
python manage.py migrate
python manage.py createsuperuser

# Frontend setup
cd ../frontend
npm install
```

## ✅ Tekshirish

Migration fayllar to'g'ri qaytganini tekshiring:

```bash
# Migration fayllarni ko'rish
ls -la backend/confessions/migrations/

# Git status tekshirish (clean bo'lishi kerak)
git status

# Database migration status
cd backend
python manage.py showmigrations
```

Barcha migrationlar `[X]` belgisi bilan ko'rsatilishi kerak:

```
confessions
 [X] 0001_initial
 [X] 0002_post_views_count
 [X] 0003_notification
 [X] 0004_alter_comment_options_comment_is_edited_and_more
```

## 💡 Kelajakda Bu Muammolardan Qochish

1. **Hech qachon migration fayllarni qo'lda o'chirmang**
2. **Database faylini (db.sqlite3) commit qilmang** - u allaqachon .gitignore da
3. **To'g'ri branchda ishlang** - `claude/fix-react-warnings-011CUrHBYEz5yDEvHnfd4vWm`
4. **Pull qilishdan oldin o'zgarishlarni commit qiling yoki stash qiling**:
   ```bash
   git stash
   git pull
   git stash pop
   ```

## ❓ Yordam

Agar hali ham muammolar bo'lsa, quyidagi ma'lumotlarni yuboring:

```bash
git status
git branch
ls -la backend/confessions/migrations/
cd backend && python manage.py showmigrations
```
