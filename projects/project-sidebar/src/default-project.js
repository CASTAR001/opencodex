// OpenCode Desktop 2.3.2 onboarding creates Documents/<localized name>. It
// stores no project flag, and the user may change languages after setup.
const names = new Set([
  "Alapértelmezett projekt", "Bellenen taslama", "Default Project", "Dự án mặc định",
  "Noklusējuma projekts", "Numatytasis projektas", "Oletusprojekti", "Podrazumijevani projekat",
  "Predvolený projekt", "Privzeti projekt", "Progetto predefinito", "Proiect implicit",
  "Projecte predeterminat", "Projek Lalai", "Projekt domyślny", "Projekti i parazgjedhur",
  "Projet par défaut", "Projeto Padrão", "Proyecto predeterminado", "Proyek Bawaan",
  "Sjálfgefið verkefni", "Standaardproject", "Standardprojekt", "Standardprosjekt",
  "Standardverkætlan", "Standart Layihə", "Standart loyiha", "Vaikeprojekt", "Varsayılan Proje",
  "Výchozí projekt", "Zadani projekt", "Προεπιλεγμένο έργο", "Лоиҳаи пешфарз",
  "Подразумевани пројекат", "Проект по подразбиране", "Проект по умолчанию", "Стандарден проект",
  "Типовий проєкт", "Өгөгдмөл төсөл", "Կանխադրված նախագիծ", "פרויקט ברירת מחדל",
  "المشروع الافتراضي", "پروژه پیش‌فرض", "ڈیفالٹ پروجیکٹ", "ޑީފޯލްޓް ޕްރޮޖެކްޓް",
  "डिफ़ॉल्ट प्रोजेक्ट", "पूर्वनिर्धारित परियोजना", "ডিফল্ট প্রকল্প", "පෙරනිමි ව්‍යාපෘතිය",
  "โปรเจกต์เริ่มต้น", "ໂຄງການເລີ່ມຕົ້ນ", "སྔོན་སྒྲིག་ལས་འགུལ", "မူရင်း ပရောဂျက်",
  "ნაგულისხმევი პროექტი", "ነባሪ ፕሮጀክት", "គម្រោងលំនាំដើម", "デフォルトプロジェクト", "預設專案", "默认项目",
  "기본 프로젝트",
])

export const defaultCloseHint = '默认项目不能关闭，可以隐藏。'

export function isDefaultProjectPath(path, documents) {
  const windows = /^(?:[A-Za-z]:|\\\\)/.test(path)
  const normalize = text => (windows ? text.replaceAll('\\', '/') : text).normalize('NFC').replace(/\/+$/, '')
  const full = normalize(path)
  const slash = full.lastIndexOf('/')
  if (slash < 0 || !names.has(full.slice(slash + 1))) return false
  // While the local Desktop directory is loading, keep candidate names protected.
  if (!documents) return true
  const parent = full.slice(0,slash)
  const expected = normalize(documents)
  return windows ? parent.toLowerCase() === expected.toLowerCase() : parent === expected
}
