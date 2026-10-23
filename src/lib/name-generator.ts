/**
 * Generator prefix email nama acak yang terstruktur, rapi, dan natural.
 * Menghasilkan username yang tampak profesional layaknya email pribadi (misal: alex.miller, sarah.smith24).
 */

const FIRST_NAMES = [
  'alex', 'adam', 'adrian', 'albert', 'alan', 'andrew', 'arthur', 'aaron', 'austin',
  'brian', 'benjamin', 'brandon', 'blake', 'charles', 'chris', 'colin', 'daniel', 'david',
  'dylan', 'edward', 'eric', 'ethan', 'evan', 'felix', 'frank', 'gabriel', 'george', 'henry',
  'ian', 'jack', 'james', 'jason', 'john', 'jordan', 'joseph', 'justin', 'kevin', 'kyle',
  'leo', 'liam', 'lucas', 'marcus', 'mason', 'michael', 'nathan', 'noah', 'oliver', 'oscar',
  'owen', 'patrick', 'peter', 'philip', 'richard', 'robert', 'ryan', 'samuel', 'simon',
  'thomas', 'victor', 'vincent', 'william',
  // Nama perempuan
  'alice', 'amelia', 'anna', 'aria', 'bella', 'claire', 'chloe', 'diana', 'elena', 'emily',
  'emma', 'eva', 'grace', 'hannah', 'iris', 'isla', 'julia', 'laura', 'lily', 'lucy',
  'maya', 'mia', 'nina', 'nora', 'olivia', 'rose', 'ruby', 'sara', 'sarah', 'stella',
  'sophia', 'vera', 'zoe'
];

const LAST_NAMES = [
  'adams', 'allen', 'anderson', 'bailey', 'baker', 'barnes', 'bell', 'bennett', 'brooks',
  'brown', 'butler', 'campbell', 'carter', 'clark', 'cole', 'collins', 'cooper', 'davis',
  'edwards', 'evans', 'fisher', 'foster', 'gray', 'green', 'hall', 'harris', 'hayes',
  'hill', 'howard', 'hughes', 'jackson', 'james', 'jenkins', 'johnson', 'jones', 'kelly',
  'king', 'lee', 'lewis', 'martin', 'miller', 'mitchell', 'moore', 'morgan', 'morris',
  'murphy', 'myers', 'nelson', 'parker', 'phillips', 'price', 'reed', 'roberts', 'robinson',
  'rogers', 'ross', 'russell', 'sanders', 'scott', 'smith', 'stewart', 'taylor', 'thomas',
  'turner', 'walker', 'ward', 'watson', 'white', 'williams', 'wilson', 'wood', 'wright', 'young'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Menghasilkan satu username email acak yang rapi dan terstruktur.
 * Format yang didukung:
 * - nama.belakang       (contoh: alex.miller, sarah.smith)
 * - nama.belakang[angka] (contoh: david.clark24, emma.turner89)
 * - nama[angka 3 digit] (contoh: nathan382, olivia519)
 * - inisial.belakang[angka] (contoh: j.walker89, m.taylor42)
 */
export function generateStructuredUsername(): string {
  const first = getRandomElement(FIRST_NAMES);
  const last = getRandomElement(LAST_NAMES);
  const rand = Math.random();

  if (rand < 0.45) {
    // 45%: firstname.lastname (sangat bersih dan profesional)
    return `${first}.${last}`;
  } else if (rand < 0.85) {
    // 40%: firstname.lastname + 2 digit angka (realistis & unik)
    const num = getRandomNumber(11, 99);
    return `${first}.${last}${num}`;
  } else if (rand < 0.95) {
    // 10%: firstname + 3 digit angka
    const num = getRandomNumber(100, 999);
    return `${first}${num}`;
  } else {
    // 5%: initial.lastname + 2 digit angka
    const initial = first.charAt(0);
    const num = getRandomNumber(11, 99);
    return `${initial}.${last}${num}`;
  }
}

/**
 * Menghasilkan beberapa opsi username acak yang unik.
 */
export function generateStructuredUsernameList(count = 5): string[] {
  const set = new Set<string>();
  while (set.size < count) {
    set.add(generateStructuredUsername());
  }
  return Array.from(set);
}
