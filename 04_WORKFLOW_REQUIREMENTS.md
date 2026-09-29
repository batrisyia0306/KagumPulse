# KagumPulse: Requirement Workflow

Dokumen ini menerangkan aliran kerja (workflow) sistem MVP. Setiap workflow mengandungi pencetus, prasyarat, langkah, peraturan, keadaan ralat dan keputusan. Carta alir menggunakan sintaks Mermaid.

| ID | Workflow | Pelaku | Fasa |
|---|---|---|---|
| WF-01 | Log masuk | Owner, Admin | MVP |
| WF-02 | Lupa dan reset kata laluan | Semua | MVP |
| WF-03 | Sync data automatik | Sistem (cron) | MVP |
| WF-04 | Sync manual | Admin | MVP |
| WF-05 | Lihat dashboard dan tukar tempoh | Owner | MVP |
| WF-06 | Konfigurasi connector | Admin | MVP |
| WF-07 | Pengurusan pengguna | Admin, Owner | MVP |
| WF-08 | Sesi dan tamat masa | Semua | MVP |
| WF-09 | Tukar kata laluan (Profil) | Semua | MVP |
| WF-10 | Kawalan akses (route guard) | Sistem | MVP |
| WF-11 | Aliran data hujung ke hujung | Sistem | MVP |

---

## WF-01: Log Masuk

| Perkara | Butiran |
|---|---|
| Pencetus | Pengguna membuka KagumPulse atau URL dilindungi tanpa sesi |
| Prasyarat | Akaun wujud dan berstatus `active` |
| Keputusan | Sesi dicipta; pengguna dialihkan mengikut peranan |
| Peraturan | BR07, BR08, BR09; FR-AUTH-01 hingga 03, 08, 09 |

```mermaid
flowchart TD
  A([Mula: buka halaman Log Masuk]) --> B[Isi emel dan kata laluan]
  B --> C{Medan kosong?}
  C -- Ya --> C1[Papar ralat inline: Emel diperlukan / Kata laluan diperlukan] --> B
  C -- Tidak --> D{Akaun dikunci?}
  D -- Ya --> D1[Banner: Akaun dikunci. Cuba semula selepas 15 minit] --> Z([Tamat])
  D -- Tidak --> E{Emel wujud, akaun aktif dan kata laluan sah?}
  E -- Tidak --> F[Tambah failed_attempts]
  F --> G{failed_attempts >= 5?}
  G -- Ya --> G1[Set locked_until = sekarang + 15 minit] --> D1
  G -- Tidak --> H[Banner: Emel atau kata laluan salah] --> B
  E -- Ya --> I[Reset failed_attempts dan locked_until]
  I --> J[Cipta sesi, kemas kini last_login_at, rekod audit login]
  J --> K{Peranan?}
  K -- Owner --> L([Dashboard Utama])
  K -- Admin --> M([Panel Admin])
```

**Peraturan khas**
- Ralat medan kosong dan banner kelayakan salah **tidak dipaparkan serentak**.
- Mesej ralat tidak mendedahkan sama ada emel wujud.
- Akaun `inactive` mendapat mesej generik yang sama seperti kelayakan salah.
- Butang menunjukkan spinner dan dilumpuhkan semasa permintaan berjalan.

---

## WF-02: Lupa dan Reset Kata Laluan

| Perkara | Butiran |
|---|---|
| Pencetus | Pengguna klik "Lupa kata laluan?" |
| Keputusan | Kata laluan baharu ditetapkan; semua sesi lama ditamatkan |
| Peraturan | FR-AUTH-06, FR-AUTH-07; token 60 minit, sekali guna |

```mermaid
flowchart TD
  A([Mula]) --> B[Masukkan emel] --> C[Papar: Jika emel berdaftar, pautan telah dihantar]
  B --> D{Emel berdaftar dan aktif?}
  D -- Ya --> E[Jana token, simpan hash SHA-256 dan expires_at +60 min]
  E --> F[Hantar emel pautan reset]
  D -- Tidak --> G[Tiada tindakan. Respons kekal sama]
  F --> H[Pengguna klik pautan]
  H --> I{Token sah, belum digunakan, belum tamat?}
  I -- Tidak --> J[Papar: Pautan tidak sah atau telah tamat] --> B
  I -- Ya --> K[Isi kata laluan baharu dan sahkan]
  K --> L{Min 8 aksara dan padan?}
  L -- Tidak --> K
  L -- Ya --> M[Simpan hash baharu, tanda used_at, tamatkan sesi lain]
  M --> N([Redirect ke Log Masuk dengan mesej berjaya])
```

---

## WF-03: Sync Data Automatik (WooCommerce)

| Perkara | Butiran |
|---|---|
| Pencetus | Scheduler pada `sync_time` (lalai 02:00) |
| Prasyarat | Connector `active` dengan kelayakan sah |
| Keputusan | Ringkasan harian dan bulanan dikemas kini; `last_synced_at` dikemas kini |
| Peraturan | BR12, BR13, BR17 hingga BR20, BR22; FR-SYNC-01 hingga 07 |

```mermaid
flowchart TD
  A([Cron mencetus sync]) --> B[Cipta sync_logs: status running, attempt 1]
  B --> C[Panggil WooCommerce REST API dengan pagination]
  C --> D{Respons berjaya?}
  D -- Tidak --> E{attempt < 3?}
  E -- Ya --> F[Tunggu, attempt + 1] --> C
  E -- Tidak --> G[Tanda sync_logs: failed, simpan error_message]
  G --> H[Dashboard kekal papar data terakhir dan label masa lama]
  H --> Z([Tamat])
  D -- Ya --> I[Tapis: hanya status completed dan produk/kategori sumbangan]
  I --> J[DALAM MEMORI: kira jumlah, bilangan transaksi, penderma unik]
  J --> K[BUANG semua data peribadi daripada memori]
  K --> L[Mula transaksi DB]
  L --> M[UPSERT donation_daily_summary]
  M --> N[UPSERT donation_monthly_summary]
  N --> O{Semua berjaya?}
  O -- Tidak --> P[Rollback] --> G
  O -- Ya --> Q[Commit]
  Q --> R[Tanda sync_logs: success, kemas kini last_synced_at]
  R --> Z
```

**Peraturan khas**
- Tarik semula sekurang-kurangnya **30 hari terkini** setiap larian supaya perubahan status (contoh refund) diambil kira.
- Larian pertama (backfill) menarik sehingga 12 bulan sejarah.
- Hanya satu larian sync bagi satu connector pada satu masa (kunci/lock).
- Kandungan `error_message` tidak boleh mengandungi data peribadi atau rahsia.

---

## WF-04: Sync Manual (Sync Sekarang)

| Perkara | Butiran |
|---|---|
| Pencetus | Admin klik **Sync Sekarang** pada Tetapan Connector |
| Peraturan | FR-CONN-05 |

```mermaid
flowchart TD
  A([Admin klik Sync Sekarang]) --> B{Sync sedang berjalan?}
  B -- Ya --> C[Toast: Sync sedang berjalan] --> Z([Tamat])
  B -- Tidak --> D[Papar spinner, cipta sync_logs triggered_by = manual]
  D --> E[Jalankan WF-03 langkah tarikan dan simpan]
  E --> F{Berjaya?}
  F -- Ya --> G[Toast hijau: Sync berjaya + masa kemas kini]
  F -- Tidak --> H[Toast merah: Sync gagal + ringkasan ralat]
  G --> Z
  H --> Z
```

---

## WF-05: Lihat Dashboard dan Tukar Tempoh

| Perkara | Butiran |
|---|---|
| Pencetus | Owner log masuk atau menukar penapis |
| Prasyarat | Peranan `owner` |
| Peraturan | FR-DASH-01 hingga 10, FR-TBQ-01 hingga 05 |

```mermaid
flowchart TD
  A([Owner buka Dashboard Utama]) --> B[Papar skeleton loading]
  B --> C[Muat data tempoh lalai: Bulan Ini]
  C --> D{Ada data?}
  D -- Tidak --> E[Papar: Tiada data untuk tempoh ini]
  D -- Ya --> F[Kira KPI dan peratus perubahan dalam kod]
  F --> G{Tempoh semasa belum tamat?}
  G -- Ya --> H[Label setakat tarikh; bandingkan julat hari sama bulan lepas]
  G -- Tidak --> I[Bandingkan dengan tempoh sebelumnya]
  H --> J{Nilai bandingan = 0?}
  I --> J
  J -- Ya --> K[Papar N/A]
  J -- Tidak --> L[Papar % dengan anak panah hijau/merah]
  K --> M[Render kad KPI, carta trend, kad unit, label Kemas kini terakhir]
  L --> M
  M --> N{Owner tukar tempoh?}
  N -- Ya --> B
  N -- Klik TBQ Amal --> O([Dashboard TBQ Amal: KPI, carta garis, carta bar, jadual])
```

**Pengendalian ralat:** jika API dalaman gagal, papar kad ralat dengan butang **Cuba Lagi**; data lama tidak dipaparkan sebagai baharu.

---

## WF-06: Konfigurasi Connector

| Perkara | Butiran |
|---|---|
| Pencetus | Admin membuka Tetapan Connector |
| Peraturan | FR-CONN-01 hingga 04 |

```mermaid
flowchart TD
  A([Admin buka Tetapan Connector]) --> B[Isi URL Kedai, Consumer Key, Consumer Secret]
  B --> C{Klik Uji Sambungan?}
  C -- Ya --> D[Panggil API WooCommerce ujian baca sahaja]
  D --> E{Berjaya?}
  E -- Ya --> F[Papar: Sambungan berjaya]
  E -- Tidak --> G[Papar mesej ralat ringkas: kunci salah / URL tidak dicapai]
  F --> H[Tetapkan masa sync harian, lalai 02:00]
  G --> B
  C -- Tidak --> H
  H --> I[Klik Simpan]
  I --> J[Sulitkan kelayakan, simpan, rekod audit connector.update]
  J --> K[Toast berjaya. Secret dipaparkan tersembunyi selepas ini]
  K --> L([Tamat])
```

---

## WF-07: Pengurusan Pengguna

| Perkara | Butiran |
|---|---|
| Pelaku | Admin, Owner |
| Peraturan | FR-USR-01 hingga 08, BR01, BR02, BR06 |

```mermaid
flowchart TD
  A([Buka Pengurusan Pengguna]) --> B[Cari / tapis peranan dan status]
  B --> C{Tindakan?}
  C -- Tambah --> D[Isi nama, emel, peranan, kata laluan sementara]
  D --> E{Emel unik dan kata laluan >= 8?}
  E -- Tidak --> D
  E -- Ya --> F[Simpan, rekod audit user.create, toast berjaya]
  C -- Ubah --> G[Ubah nama / emel / peranan]
  G --> H{Menukar Owner terakhir?}
  H -- Ya --> I[Tolak: mesti ada sekurang-kurangnya seorang Owner aktif]
  H -- Tidak --> J[Simpan, rekod audit]
  C -- Nyahaktif --> K{Akaun sendiri atau Owner terakhir?}
  K -- Ya --> I
  K -- Tidak --> L[Dialog pengesahan]
  L --> M{Sahkan?}
  M -- Ya --> N[status = inactive, tamatkan sesi pengguna itu, toast]
  M -- Tidak --> B
  C -- Reset kata laluan --> O[Jana kata laluan sementara / hantar pautan reset]
```

---

## WF-08: Sesi dan Tamat Masa

```mermaid
flowchart TD
  A([Pengguna aktif]) --> B[Setiap aktiviti: set semula pemasa 30 minit]
  B --> C{Tiada aktiviti 25 minit?}
  C -- Tidak --> B
  C -- Ya --> D[Papar modal: Sesi akan tamat dalam 5 minit. Kekal log masuk?]
  D --> E{Pengguna klik Kekal?}
  E -- Ya --> B
  E -- Tidak / tiada tindak balas --> F[Minit ke-30: musnahkan sesi]
  F --> G([Redirect ke Log Masuk: Sesi anda telah tamat])
```

---

## WF-09: Tukar Kata Laluan (Profil Saya)

```mermaid
flowchart TD
  A([Buka Profil Saya]) --> B[Isi kata laluan lama, baharu, sahkan]
  B --> C{Kata laluan lama betul?}
  C -- Tidak --> D[Ralat: Kata laluan lama salah] --> B
  C -- Ya --> E{Baharu >= 8 aksara, padan, berbeza daripada lama?}
  E -- Tidak --> F[Validasi inline langsung] --> B
  E -- Ya --> G[Simpan hash baharu, tamatkan sesi peranti lain]
  G --> H([Toast: Kata laluan berjaya dikemas kini])
```

---

## WF-10: Kawalan Akses (Route Guard)

| Halaman/Fungsi | Owner | Admin | Tiada sesi |
|---|---|---|---|
| Dashboard Utama, Dashboard TBQ Amal | Benarkan | **403** | Log Masuk |
| Panel Admin, Tetapan Connector | **403** | Benarkan | Log Masuk |
| Pengurusan Pengguna | Benarkan | Benarkan | Log Masuk |
| Profil Saya | Benarkan | Benarkan | Log Masuk |
| API data prestasi (`/api/dashboard/*`) | Benarkan | **403** | 401 |

```mermaid
flowchart TD
  A([Permintaan halaman/API]) --> B{Ada sesi sah?}
  B -- Tidak --> C[Redirect ke Log Masuk / 401 untuk API]
  B -- Ya --> D{Akaun masih aktif?}
  D -- Tidak --> E[Tamatkan sesi, ke Log Masuk]
  D -- Ya --> F{Peranan dibenarkan untuk sumber ini?}
  F -- Tidak --> G[403 Akses Ditolak]
  F -- Ya --> H[Teruskan]
```

**Peraturan:** semakan dibuat di **server** pada setiap permintaan; menyembunyikan menu sahaja tidak mencukupi.

---

## WF-11: Aliran Data Hujung ke Hujung

```mermaid
flowchart LR
  W[(WooCommerce TBQ Amal)] -->|REST API| C[Connector]
  S[Scheduler 02:00] --> C
  C --> P[Tapis completed, kira agregat, buang PII dalam memori]
  P --> D[(donation_daily_summary + donation_monthly_summary)]
  P --> L[(sync_logs)]
  D --> K[Servis KPI]
  K --> UI[Dashboard Owner]
  L --> AD[Panel Admin: status sync]
```

| Peringkat | Input | Proses | Output |
|---|---|---|---|
| 1. Tarik | Transaksi WooCommerce | Panggil API, pagination | Data mentah dalam memori |
| 2. Tapis dan agregat | Data mentah | Hanya `completed`; kira jumlah, transaksi, penderma unik | Nilai agregat |
| 3. Buang PII | Data mentah | Padam daripada memori | Tiada data peribadi |
| 4. Simpan | Nilai agregat | Upsert dalam transaksi DB | Ringkasan harian dan bulanan |
| 5. Rekod | Keputusan larian | Tulis `sync_logs`, kemas kini `last_synced_at` | Jejak sync |
| 6. Paparan | Ringkasan | Kira KPI dan % | Kad, carta, jadual |

---

## Keadaan Ralat dan Mesej Standard

| Keadaan | Mesej (BM) | Tindakan sistem |
|---|---|---|
| Kelayakan salah | Emel atau kata laluan salah | Tambah failed_attempts |
| Akaun dikunci | Akaun dikunci. Cuba semula selepas 15 minit | Lumpuhkan butang |
| Sesi tamat | Sesi anda telah tamat. Sila log masuk semula | Redirect |
| Tiada kebenaran | Anda tiada kebenaran untuk mengakses halaman ini | 403 |
| Halaman tiada | Halaman tidak dijumpai | 404 |
| Tiada data | Tiada data untuk tempoh ini | Keadaan kosong |
| Sync gagal | Sync gagal. Data terakhir dikemas kini pada [masa] | Log + label |
| Uji sambungan gagal | Sambungan gagal. Semak URL dan kunci API | Kekal di borang |
| Bandingan sifar | N/A | Papar N/A |

---

## Ringkasan Peranan dan Workflow

| Peranan | Workflow terlibat |
|---|---|
| Owner | WF-01, 02, 05, 07, 08, 09, 10 |
| Admin | WF-01, 02, 04, 06, 07, 08, 09, 10 |
| Sistem (cron) | WF-03, 11 |
