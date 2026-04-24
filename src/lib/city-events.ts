import { CITIES_BY_CODE } from "@/data/cities";
import { NEWS_BY_QUARTER } from "@/data/world-news";
import type { NewsItem } from "@/types/game";

export interface CityEventImpact {
  /** Blended percentage impact across current-quarter news items that
   *  mention this city. Positive = demand up, negative = demand down. */
  pct: number;
  /** Underlying news items referencing this city or its region. */
  items: NewsItem[];
}

/**
 * Approximate per-city event impact for the current quarter.
 * Scans world-news items for explicit city-code mentions (+%) and blends
 * with impact-type defaults for broader news that implicates this region.
 */
export function cityEventImpact(
  cityCode: string,
  quarter: number,
): CityEventImpact {
  const city = CITIES_BY_CODE[cityCode];
  if (!city) return { pct: 0, items: [] };

  const news = NEWS_BY_QUARTER[quarter] ?? [];
  const codeWord = new RegExp(`\\b${cityCode}\\b`);
  const regionMatchers: Record<string, RegExp> = {
    na: /\b(North America|Americas|NYC|US|Canada)\b/i,
    sa: /\b(South America|Latin America|Mexico|Brazil)\b/i,
    la: /\b(Latin America|South America|Mexico|Brazil)\b/i,
    eu: /\b(Europe|European|EU)\b/i,
    me: /\b(Middle East|Gulf)\b/i,
    mea: /\b(Middle East|Africa|Gulf)\b/i,
    af: /\b(Africa|African)\b/i,
    as: /\b(Asia|Asia[- ]Pacific|South[- ]?East Asia)\b/i,
    oc: /\b(Oceania|Australia|Pacific)\b/i,
  };
  const regionRe = regionMatchers[city.region];

  const items: NewsItem[] = [];
  let pct = 0;

  for (const n of news) {
    const text = `${n.headline} ${n.detail}`;
    const codeHit = codeWord.test(text);
    const regionHit = !!regionRe && regionRe.test(text);
    if (!codeHit && !regionHit) continue;
    items.push(n);

    // Try to parse an explicit percentage next to the city code or in detail
    const explicit = /([+\-])?(\d{1,2})%/.exec(n.detail);
    let nominal = 0;
    if (explicit) {
      const sign = explicit[1] === "-" ? -1 : 1;
      nominal = sign * parseInt(explicit[2], 10);
    } else {
      // Implicit defaults by impact
      switch (n.impact) {
        case "tourism":  nominal = 5; break;
        case "business": nominal = 5; break;
        case "cargo":    nominal = 4; break;
        case "brand":    nominal = 2; break;
        case "fuel":     nominal = -3; break;
        case "ops":      nominal = -4; break;
        default:         nominal = 0;
      }
    }
    // City-specific hits weigh double over region-only
    pct += codeHit ? nominal : nominal * 0.5;
  }

  return { pct: Math.round(pct), items };
}
