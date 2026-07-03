// ==== كتاب الافتتاحيات: أشهر الافتتاحيات تُعرض حية أثناء اللعب ====

const OPENINGS = [
  { m: "e4 e5 Nf3 Nc6 Bb5", ar: "الإسبانية (روي لوبيز)", en: "Ruy Lopez" },
  { m: "e4 e5 Nf3 Nc6 Bc4", ar: "الإيطالية", en: "Italian Game" },
  { m: "e4 e5 Nf3 Nc6 Bc4 Bc5", ar: "جيوكو بيانو", en: "Giuoco Piano" },
  { m: "e4 e5 Nf3 Nc6 Bc4 Nf6", ar: "دفاع الحصانين", en: "Two Knights Defense" },
  { m: "e4 e5 Nf3 Nc6 d4", ar: "الاسكتلندية", en: "Scotch Game" },
  { m: "e4 e5 Nf3 Nf6", ar: "دفاع بيتروف", en: "Petrov Defense" },
  { m: "e4 e5 Nf3 d6", ar: "دفاع فيليدور", en: "Philidor Defense" },
  { m: "e4 e5 Nc3", ar: "فيينا", en: "Vienna Game" },
  { m: "e4 e5 f4", ar: "غامبيت الملك", en: "King's Gambit" },
  { m: "e4 e5 Nf3 Nc6 Nc3 Nf6", ar: "الحصن الرباعي", en: "Four Knights Game" },
  { m: "e4 c5", ar: "الصقلية", en: "Sicilian Defense" },
  { m: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6", ar: "الصقلية نايدورف", en: "Sicilian Najdorf" },
  { m: "e4 c5 Nf3 Nc6", ar: "الصقلية الكلاسيكية", en: "Classical Sicilian" },
  { m: "e4 c5 c3", ar: "صقلية ألابين", en: "Alapin Sicilian" },
  { m: "e4 e6", ar: "الفرنسية", en: "French Defense" },
  { m: "e4 c6", ar: "كارو-كان", en: "Caro-Kann Defense" },
  { m: "e4 d5", ar: "الإسكندنافية", en: "Scandinavian Defense" },
  { m: "e4 d6 d4 Nf6", ar: "دفاع بيرتس", en: "Pirc Defense" },
  { m: "e4 Nf6", ar: "دفاع ألخين", en: "Alekhine Defense" },
  { m: "e4 g6", ar: "الدفاع الحديث", en: "Modern Defense" },
  { m: "d4 d5 c4", ar: "غامبيت الوزير", en: "Queen's Gambit" },
  { m: "d4 d5 c4 dxc4", ar: "غامبيت الوزير المقبول", en: "Queen's Gambit Accepted" },
  { m: "d4 d5 c4 e6", ar: "غامبيت الوزير المرفوض", en: "Queen's Gambit Declined" },
  { m: "d4 d5 c4 c6", ar: "السلافية", en: "Slav Defense" },
  { m: "d4 d5 Nf3 Nf6 Bf4", ar: "نظام لندن", en: "London System" },
  { m: "d4 Nf6 c4 g6 Nc3 Bg7", ar: "الهندية الملكية", en: "King's Indian Defense" },
  { m: "d4 Nf6 c4 e6 Nc3 Bb4", ar: "نيمزو الهندية", en: "Nimzo-Indian Defense" },
  { m: "d4 Nf6 c4 g6 Nc3 d5", ar: "غرونفيلد", en: "Grünfeld Defense" },
  { m: "d4 Nf6 c4 e6 Nf3 b6", ar: "الهندية الوزيرية", en: "Queen's Indian Defense" },
  { m: "d4 f5", ar: "الهولندية", en: "Dutch Defense" },
  { m: "d4 Nf6 c4 c5 d5", ar: "بينوني", en: "Benoni Defense" },
  { m: "d4 Nf6 Bg5", ar: "ترومبوفسكي", en: "Trompowsky Attack" },
  { m: "d4 d5", ar: "بيدق الوزير", en: "Queen's Pawn Game" },
  { m: "d4 Nf6", ar: "الدفاع الهندي", en: "Indian Defense" },
  { m: "c4", ar: "الإنجليزية", en: "English Opening" },
  { m: "Nf3 d5 g3", ar: "ريتي", en: "Réti Opening" },
  { m: "Nf3", ar: "افتتاح ريتي/الحصان", en: "Zukertort Opening" },
  { m: "f4", ar: "افتتاح بيرد", en: "Bird's Opening" },
  { m: "b3", ar: "لارسن", en: "Larsen's Opening" },
  { m: "g3", ar: "افتتاح الملك الهندي", en: "King's Fianchetto" },
  { m: "e4 e5", ar: "لعبة الملك المفتوحة", en: "Open Game" },
  { m: "e4", ar: "بيدق الملك", en: "King's Pawn Game" },
  { m: "d4", ar: "بيدق الوزير", en: "Queen's Pawn Opening" },
];

// أطول تطابق بادئة مع تاريخ النقلات
function openingName(sans, lang) {
  const line = sans.join(" ");
  let best = null;
  for (const o of OPENINGS) {
    if (line === o.m || line.startsWith(o.m + " ")) {
      if (!best || o.m.length > best.m.length) best = o;
    }
  }
  return best ? best[lang] || best.ar : null;
}
