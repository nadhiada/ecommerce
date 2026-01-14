# 🛒 Ecommerce Project (Node.js)

Project ini merupakan aplikasi **E-Commerce** yang dikembangkan untuk keperluan **Praktikum Basis Data Lanjut**, menggunakan **Oracle Database** sebagai sistem basis data dan **Node.js (Express)** sebagai backend server.

---

## 📁 Lokasi Project

```
D:\NADHIA\SEMESTER 3\Prak BDL\ecommerce
```

---

## ⚙️ Teknologi yang Digunakan

* Node.js
* Express.js
* HTML, CSS, JavaScript
* (Opsional) EJS
* **Oracle Database (terhubung langsung menggunakan driver Oracle)**

---

## ▶️ Cara Menjalankan Project

1. Buka terminal di folder project

```
cd D:\NADHIA\SEMESTER 3\Prak BDL\ecommerce
```

2. Install dependency

```
npm install
```

3. Jalankan server

```
node app.js
```

4. Buka browser

```
http://localhost:3000
```

---

## 🌐 Akses File Statis

Folder `public` digunakan untuk menyimpan file yang bisa ditampilkan di web.

Contoh file:

```
public/images/produk.jpg
```

Akses di browser:

```
http://localhost:3000/images/produk.jpg
```

Contoh di HTML / EJS:

```html
<img src="/images/produk.jpg" alt="Produk">
```

---

## 📦 Upload File (Jika Digunakan)

Jika project mendukung upload (menggunakan multer), file akan disimpan di folder:

```
uploads/
```

Dan di `app.js` harus ada:

```js
app.use('/uploads', express.static('uploads'));
```

Akses file:

```
http://localhost:3000/uploads/nama_file.jpg
```

---

## ❗ Catatan Penting

* Jangan menyimpan file statis di luar folder yang di-*expose*
* Path di HTML **tidak perlu menuliskan `/public`**
* Pastikan nama file & folder sesuai (case-sensitive)

---

## 👩‍💻 Author

**Nadhia Artifasari**
Praktikum Basis Data Lanjut – Semester 3

---

✨ *README ini dibuat untuk membantu dokumentasi dan pemahaman struktur project ecommerce Node.js.*
