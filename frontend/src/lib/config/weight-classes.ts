export interface WeightClass {
  slug: string;
  name: string;
  weightLbs: string;
  weightKg: string;
  gender: 'male' | 'female';
  apiCategory: string; // category name used by API-Sports MMA API
}

export const weightClasses: WeightClass[] = [
  // Men's divisions
  { slug: 'heavyweight', name: 'Heavyweight', weightLbs: '265 lbs', weightKg: '120 kg', gender: 'male', apiCategory: 'Heavyweight' },
  { slug: 'light-heavyweight', name: 'Light Heavyweight', weightLbs: '205 lbs', weightKg: '93 kg', gender: 'male', apiCategory: 'Light Heavyweight' },
  { slug: 'middleweight', name: 'Middleweight', weightLbs: '185 lbs', weightKg: '84 kg', gender: 'male', apiCategory: 'Middleweight' },
  { slug: 'welterweight', name: 'Welterweight', weightLbs: '170 lbs', weightKg: '77 kg', gender: 'male', apiCategory: 'Welterweight' },
  { slug: 'lightweight', name: 'Lightweight', weightLbs: '155 lbs', weightKg: '70 kg', gender: 'male', apiCategory: 'Lightweight' },
  { slug: 'featherweight', name: 'Featherweight', weightLbs: '145 lbs', weightKg: '66 kg', gender: 'male', apiCategory: 'Featherweight' },
  { slug: 'bantamweight', name: 'Bantamweight', weightLbs: '135 lbs', weightKg: '61 kg', gender: 'male', apiCategory: 'Bantamweight' },
  { slug: 'flyweight', name: 'Flyweight', weightLbs: '125 lbs', weightKg: '57 kg', gender: 'male', apiCategory: 'Flyweight' },
  { slug: 'strawweight', name: 'Strawweight', weightLbs: '115 lbs', weightKg: '52 kg', gender: 'male', apiCategory: 'Strawweight' },
  // Women's divisions
  { slug: 'women-bantamweight', name: "Women's Bantamweight", weightLbs: '135 lbs', weightKg: '61 kg', gender: 'female', apiCategory: "Women's Bantamweight" },
  { slug: 'women-flyweight', name: "Women's Flyweight", weightLbs: '125 lbs', weightKg: '57 kg', gender: 'female', apiCategory: "Women's Flyweight" },
  { slug: 'women-strawweight', name: "Women's Strawweight", weightLbs: '115 lbs', weightKg: '52 kg', gender: 'female', apiCategory: "Women's Strawweight" },
];

export function getWeightClassBySlug(slug: string): WeightClass | undefined {
  return weightClasses.find((wc) => wc.slug === slug);
}

export function getAllWeightClassSlugs(): string[] {
  return weightClasses.map((wc) => wc.slug);
}
