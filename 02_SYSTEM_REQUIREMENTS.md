# KagumPulse: Requirement Sistem (System Requirements Specification)

| Perkara | Butiran |
|---|---|
| Nama sistem | KagumPulse (Kagum Unified Analytics Dashboard) |
| Klien | Kagum Group |
| Versi dokumen | 1.0 (MVP) |
| Kaedah | PCR (Problem, Cause, Resolution) |
| Skop MVP | Unit TBQ Amal (WooCommerce) |

---

## 1. Pendahuluan

### 1.1 Problem Statement
Pihak pengurusan Kagum Group tidak mempunyai satu paparan menyeluruh untuk memantau prestasi Akademi Prosilat, TBQ Amal dan Kagum Digital kerana data terperangkap dalam platform berasingan (smap.my, WooCommerce dan rekod manual). Pengurusan perlu log masuk ke setiap sistem dan mengompil laporan secara manual, satu proses yang memakan masa, terdedah kepada ralat dan menyebabkan keputusan berdasarkan data lapuk.

### 1.2 Objektif
1. **Membangunkan** sistem web dashboard analitik berpusat (KagumPulse) yang menggabungkan data agregat daripada unit perniagaan Kagum.
2. **Mengautomasikan** tarikan dan kompilasi data melalui API dan penjadual bagi mengurangkan masa penyediaan laporan kepada kurang 10 minit.
3. **Menyediakan** kawalan akses berperanan dengan pematuhan PDPA.

### 1.3 Skop

| Dalam skop (MVP) | Luar skop (Fasa 2 dan 3) |
|---|---|
| Dashboard TBQ Amal | Dashboard Prosilat dan Kagum Digital |
| Connector WooCommerce (REST API) | Import CSV smap.my, Google Sheets |
| Sync harian automatik | Eksport PDF/Excel |
| Peranan Owner dan Admin | Peranan Pengurus dan Data Entry |
| Login, lupa kata laluan, kunci akaun, tamat sesi | 2FA, log audit penuh |
| Pengurusan pengguna asas | Notifikasi amaran, ramalan hasil |

---

## 2. Pengguna dan Peranan

| Peranan | Fasa | Keupayaan | Sekatan |
|---|---|---|---|
| **Owner** | MVP | Lihat semua dashboard, urus pengguna | Tiada akses konfigurasi connector |
| **Admin** | MVP | Urus pengguna, connector, semak status sync | **Tidak boleh** lihat data prestasi |
| Pengurus / SV Unit | Fasa 2 | Lihat dashboard unit sendiri, eksport laporan unit | Unit sendiri sahaja |
| Staf Data Entry | Fasa 2 | Isi borang data manual | Tiada akses dashboard |

**Sistem luaran:** WooCommerce REST API (TBQ Amal), Scheduler/Cron, Servis emel (reset kata laluan).

---

## 3. Andaian dan Kekangan

| ID | Andaian / Kekangan | Tindakan |
|---|---|---|
| A1 | **Bilangan penderma** bagi tempoh berbilang bulan = jumlah penderma unik setiap bulan (penderma yang sama dalam dua bulan dikira dua kali). Penderma unik sebenar merentas tempoh memerlukan data peribadi. | **Sahkan dengan Kagum** |
| A2 | Kedai WooCommerce TBQ Amal menyediakan REST API dengan Consumer Key/Secret peranan *read-only*. | Sahkan akses |
| A3 | Sumbangan dikenal pasti melalui produk/kategori tertentu dalam WooCommerce. | Sahkan pemetaan produk/kategori |
| A4 | Zon waktu operasi: Asia/Kuala_Lumpur (UTC+8). | |
| A5 | Nilai lalai (5 percubaan, 15 minit kunci, 30 minit sesi, cron 02:00, retensi 24 bulan) boleh dilaras. | Sahkan dengan Kagum |
| K1 | Sistem hanya menyimpan data agregat (PDPA). | Wajib |
| K2 | Sistem web sahaja (tiada aplikasi mudah alih asli). | |

---

## 4. Keperluan Fungsian (Functional Requirements)

**Keutamaan:** M = Must, S = Should, C = Could. Semua di bawah ialah **MVP** kecuali dinyatakan.

### 4.1 Pengesahan dan Sesi (AUTH)

| ID | Keperluan | Keutamaan | Fungsi | Peraturan |
|---|---|---|---|---|
| FR-AUTH-01 | Pengguna berdaftar boleh log masuk dengan emel dan kata laluan | M | F11 | BR01 |
| FR-AUTH-02 | Mesej ralat login generik: `Emel atau kata laluan salah` | M | F11 | |
| FR-AUTH-03 | Akaun dikunci 15 minit selepas 5 percubaan gagal berturut-turut | M | F11 | BR08 |
| FR-AUTH-04 | Sesi tamat selepas 30 minit tanpa aktiviti; amaran pada minit ke-25 | M | F11 | BR09 |
| FR-AUTH-05 | Pengguna boleh log keluar dan sesi dimusnahkan | M | F11 | |
| FR-AUTH-06 | Lupa kata laluan menghantar pautan reset (tamat 60 minit, sekali guna); respons sentiasa generik | M | F11 | |
| FR-AUTH-07 | Halaman reset menguatkuasakan kata laluan minimum 8 aksara dan padanan pengesahan | M | | BR07 |
| FR-AUTH-08 | Borang login: validasi medan kosong inline; banner ralat dan ralat inline **tidak dipaparkan serentak** | M | | |
| FR-AUTH-09 | Pengguna nyahaktif tidak boleh log masuk | M | | BR06 |

### 4.2 Kawalan Akses (RBAC)

| ID | Keperluan | Keutamaan | Fungsi | Peraturan |
|---|---|---|---|---|
| FR-RBAC-01 | Setiap pengguna mempunyai tepat satu peranan (`owner` / `admin`) | M | F12 | BR02 |
| FR-RBAC-02 | Menu sidebar dipaparkan mengikut peranan | M | F12 | |
| FR-RBAC-03 | Route guard di server: akses tanpa kebenaran dialihkan ke 403 | M | F12 | |
| FR-RBAC-04 | Admin tidak boleh mengakses sebarang halaman/API yang memulangkan data prestasi | M | F12 | BR04 |

### 4.3 Dashboard Utama (DASH)

| ID | Keperluan | Keutamaan | Fungsi |
|---|---|---|---|
| FR-DASH-01 | Papar 4 kad KPI: Jumlah Sumbangan (RM), Bilangan Penderma, Purata Sumbangan (RM), Bilangan Transaksi; setiap satu dengan % perubahan | M | F1 |
| FR-DASH-02 | Penapis tempoh: Bulan Ini, Bulan Lepas, 3 Bulan, 12 Bulan, Tersuai | M | F3 |
| FR-DASH-03 | Carta garis Trend Sumbangan Bulanan (12 bulan) dengan tooltip dan label data | M | F2 |
| FR-DASH-04 | Label `Kemas kini terakhir: <tarikh, masa>` daripada sync berjaya terakhir | M | F1 |
| FR-DASH-05 | Kad unit: TBQ Amal (aktif, pautan ke dashboard); Prosilat dan Kagum Digital (`Akan datang`) | M | F1 |
| FR-DASH-06 | Tempoh separa: label `setakat <tarikh>`, bandingkan dengan julat hari sama bulan lepas | M | F1 |
| FR-DASH-07 | Jika bandingan = 0, papar `N/A` | M | |
| FR-DASH-08 | Perubahan penapis mengemas kini semua kad dan carta | M | F3 |
| FR-DASH-09 | Keadaan loading (skeleton), kosong (`Tiada data untuk tempoh ini`) dan ralat | M | |
| FR-DASH-10 | Tiada loceng notifikasi dalam MVP | M | |

### 4.4 Dashboard TBQ Amal (TBQ)

| ID | Keperluan | Keutamaan | Fungsi |
|---|---|---|---|
| FR-TBQ-01 | Papar kad KPI yang sama seperti FR-DASH-01 untuk TBQ Amal | M | F1 |
| FR-TBQ-02 | Carta garis trend bulanan (12 bulan) | M | F2 |
| FR-TBQ-03 | Carta bar perbandingan sumbangan mengikut bulan | M | F2 |
| FR-TBQ-04 | Jadual agregat: Tempoh, Jumlah (RM), Bilangan Transaksi, Purata (RM); boleh disusun | M | F2 |
| FR-TBQ-05 | Tiada nama, emel, telefon atau alamat penderma dipaparkan | M | F15 |

### 4.5 Connector dan Sync (CONN / SYNC)

| ID | Keperluan | Keutamaan | Fungsi | Peraturan |
|---|---|---|---|---|
| FR-CONN-01 | Admin boleh mengkonfigurasi connector WooCommerce (URL, Consumer Key, Consumer Secret) | M | F5 | |
| FR-CONN-02 | Rahsia disimpan disulitkan dan tidak dipaparkan semula selepas simpan | M | F5 | |
| FR-CONN-03 | Butang **Uji Sambungan** memulangkan berjaya/gagal dengan mesej | M | F5 | |
| FR-CONN-04 | Admin boleh menetapkan masa sync harian (lalai 02:00); percubaan semula tetap 3 | M | F8 | BR17 |
| FR-CONN-05 | Butang **Sync Sekarang** mencetus sync manual dengan penunjuk kemajuan dan toast keputusan | M | F5 | |
| FR-SYNC-01 | Scheduler menjalankan sync harian secara automatik | M | F8 | BR17 |
| FR-SYNC-02 | Sync gagal dicuba semula sehingga 3 kali; kemudian direkod dalam `sync_logs` | M | F8 | BR18 |
| FR-SYNC-03 | Data peribadi dibuang dalam memori; hanya agregat ditulis ke DB | M | F15 | BR12, BR13 |
| FR-SYNC-04 | Hanya transaksi `completed` dikira | M | | BR22 |
| FR-SYNC-05 | Upsert pada (unit, tarikh) supaya tiada duplikasi | M | | BR20 |
| FR-SYNC-06 | Jika sync gagal, dashboard terus papar data sah terakhir dengan label masa | M | | BR19 |
| FR-SYNC-07 | Setiap larian sync direkod: masa mula/tamat, status, bilangan rekod, ralat | M | F10 (asas) | |

### 4.6 Pengurusan Pengguna (USR)

| ID | Keperluan | Keutamaan | Fungsi |
|---|---|---|---|
| FR-USR-01 | Senarai pengguna dengan carian (nama/emel) dan penapis (peranan, status) | M | F13 |
| FR-USR-02 | Tambah pengguna: nama, emel unik, peranan, kata laluan sementara (min 8 aksara) | M | F13 |
| FR-USR-03 | Ubah nama, emel dan peranan pengguna | M | F13 |
| FR-USR-04 | Nyahaktif/aktifkan pengguna dengan dialog pengesahan | M | F13 |
| FR-USR-05 | Admin tidak boleh menyahaktifkan akaun sendiri | M | F13 |
| FR-USR-06 | Reset kata laluan pengguna oleh Admin/Owner | M | F13 |
| FR-USR-07 | Toast untuk kejayaan dan ralat | S | |
| FR-USR-08 | Sistem mesti sentiasa mempunyai sekurang-kurangnya seorang Owner aktif | M | |

### 4.7 Panel Admin, Profil dan Ralat

| ID | Keperluan | Keutamaan |
|---|---|---|
| FR-ADM-01 | Panel Admin memaparkan Status Sistem, Sync Terakhir (masa, berjaya/gagal), Pengguna Aktif, Connector Aktif | M |
| FR-ADM-02 | Nota `Admin tidak mempunyai akses kepada data prestasi`; tiada KPI dipaparkan | M |
| FR-PRO-01 | Profil Saya: papar nama, emel, peranan (baca sahaja) | M |
| FR-PRO-02 | Tukar kata laluan (lama, baharu, sahkan) dengan validasi langsung | M |
| FR-ERR-01 | Halaman 403 dan 404; butang kembali mengikut peranan | M |

---

## 5. Keperluan Bukan Fungsian (Non-Functional Requirements)

| ID | Kategori | Keperluan | Ukuran |
|---|---|---|---|
| NFR-01 | Prestasi | Halaman dashboard dimuatkan sepenuhnya | ≤ 3 saat pada sambungan biasa |
| NFR-02 | Prestasi | Tukar penapis tempoh | ≤ 1.5 saat |
| NFR-03 | Prestasi | Sync harian TBQ Amal | Selesai dalam ≤ 10 minit |
| NFR-04 | Keselamatan | Kata laluan di-hash (bcrypt/argon2); HTTPS wajib | 100% |
| NFR-05 | Keselamatan | Perlindungan CSRF, XSS, SQL injection; validasi di server | Lulus semakan OWASP Top 10 asas |
| NFR-06 | Keselamatan | Rahsia API disulitkan (at rest); `.env` di luar repositori | 100% |
| NFR-07 | PDPA | Tiada data peribadi penderma dalam pangkalan data | Diaudit melalui skema DB dan ujian |
| NFR-08 | Ketersediaan | Ketersediaan sistem waktu bekerja | ≥ 99% |
| NFR-09 | Kebolehpercayaan | Kegagalan sync tidak merosakkan data sedia ada | Data terakhir kekal |
| NFR-10 | Kebolehgunaan | Owner dapat memahami status keseluruhan tanpa latihan | ≤ 5 minit (ujian pengguna) |
| NFR-11 | Kebolehgunaan | UI Bahasa Melayu konsisten | 100% teks |
| NFR-12 | Responsif | Berfungsi pada desktop, tablet, mudah alih | Lebar 360px ke atas |
| NFR-13 | Aksesibiliti | Kontras dan fokus | WCAG 2.1 AA |
| NFR-14 | Keserasian | Pelayar | Chrome, Edge, Firefox, Safari (2 versi terkini) |
| NFR-15 | Kebolehselenggaraan | Lapisan connector boleh diganti tanpa ubah UI | Antaramuka `DataConnector` |
| NFR-16 | Kebolehskalaan | Boleh tambah unit perniagaan baharu tanpa ubah skema teras | `business_units` generik |
| NFR-17 | Sandaran | Backup DB harian; retensi 30 hari | Ujian pemulihan berkala |
| NFR-18 | Pemerhatian | Ralat sistem direkod dalam log aplikasi | |
| NFR-19 | Retensi data | Data ringkasan disimpan ≥ 24 bulan | Boleh dilaras |

---

## 6. Peraturan Pengiraan KPI

| KPI | Formula |
|---|---|
| Jumlah Sumbangan | `SUM(total_amount)` dalam tempoh |
| Bilangan Transaksi | `SUM(transaction_count)` |
| Purata Sumbangan | Jumlah Sumbangan ÷ Bilangan Transaksi |
| Bilangan Penderma | `SUM(unique_donor_count)` bulanan bagi tempoh (andaian A1) |
| Perubahan % | `(semasa − sebelum) ÷ sebelum × 100`; `N/A` jika sebelum = 0 |

Format: RM dengan 2 tempat perpuluhan, pemisah ribu; peratus 1 tempat perpuluhan.

---

## 7. Kriteria Penerimaan (Acceptance Criteria)

| ID | Senario | Keputusan dijangka |
|---|---|---|
| AC-01 | Owner log masuk dengan kelayakan sah | Dialihkan ke Dashboard Utama |
| AC-02 | Login salah 5 kali berturut-turut | Akaun dikunci 15 minit; butang dilumpuhkan |
| AC-03 | Admin cuba buka `/dashboard` melalui URL | Dialihkan ke halaman 403 |
| AC-04 | Cron berjalan pada 02:00 | Data WooCommerce terbaru dalam DB; label kemas kini berubah |
| AC-05 | WooCommerce tidak dapat dicapai | 3 percubaan semula, ralat direkod, dashboard papar data terakhir |
| AC-06 | Sync dijalankan dua kali pada hari sama | Tiada duplikasi rekod |
| AC-07 | Pemeriksaan pangkalan data selepas sync | Tiada nama, emel, telefon atau alamat penderma |
| AC-08 | Pilih "Bulan Ini" pada 26 Mei | Label `setakat 26 Mei`; % dibandingkan dengan 1–26 April |
| AC-09 | Bulan lepas bernilai 0 | Perubahan dipaparkan `N/A` |
| AC-10 | Sesi tiada aktiviti 25 minit | Amaran dipaparkan; log keluar automatik pada minit ke-30 |
| AC-11 | Angka dashboard dibandingkan dengan WooCommerce | Sepadan untuk tempoh yang sama |
| AC-12 | Owner cuba menyahaktifkan Owner terakhir | Ditolak dengan mesej |

**Ujian kejayaan MVP:** Owner boleh membuka KagumPulse, log masuk dan melihat angka sumbangan TBQ Amal yang sepadan dengan WooCommerce, tanpa sebarang kerja manual.

---

## 8. Matriks Jejak (Traceability)

| Objektif | Fungsi | Requirement |
|---|---|---|
| Objektif 1: Dashboard berpusat | F1, F2, F3, F4 | FR-DASH-*, FR-TBQ-* |
| Objektif 2: Automasi data | F5, F8, F10 (asas) | FR-CONN-*, FR-SYNC-* |
| Objektif 3: Akses dan PDPA | F11, F12, F13, F15 | FR-AUTH-*, FR-RBAC-*, FR-USR-*, FR-SYNC-03 |

---

## 9. Risiko dan Mitigasi

| Risiko | Kesan | Mitigasi |
|---|---|---|
| API WooCommerce berubah / kunci tamat | Sync gagal | Lapisan connector boleh diganti; log sync; data terakhir kekal |
| Definisi "sumbangan" dan "penderma" tidak jelas | KPI tidak tepat | Sahkan A1 dan A3 sebelum bina |
| Adopsi rendah oleh pengurusan | Sistem tidak digunakan | Libatkan Owner sejak reka bentuk; ukur kekerapan guna |
| Kebocoran data peribadi | Pelanggaran PDPA | Buang PII dalam memori; skema tanpa medan PII; ujian automatik |
| Skop merebak | Lewat siap | Kekalkan MVP satu unit; Fasa 2 dan 3 berasingan |

---

## 10. Pelan Fasa

| Fasa | Kandungan | Anggaran |
|---|---|---|
| **1 (MVP)** | Dokumen ini | 2–3 minggu |
| **2** | Prosilat, Kagum Digital, CSV/Sheets, eksport, 2FA, log audit, peranan Pengurus dan Data Entry | Selepas MVP disahkan |
| **3** | Notifikasi amaran, ramalan hasil | Selepas Fasa 2 |
