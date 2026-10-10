import { afterEach, describe, expect, it } from 'vitest';

import { hydrateWeather } from '../hydrate';
import { configureWeather } from './config';
import { computeDayWeather, getSeason } from './weather';

const BUILTIN_IDS = [
  'sunny',
  'hot_sunny',
  'partly_cloudy',
  'cloudy',
  'overcast',
  'light_rain',
  'rainy',
  'windy',
  'snowy',
  'freezing',
];

/**
 * Daily weather produced by the original hard-coded generator, pinned before
 * `weather.json` support. One digit per day (index into BUILTIN_IDS) and one
 * char per day for the temperature (char code - 48), for each year from Jan 1.
 */
const PINNED = [
  {
    seed: 0,
    year: 2025,
    conditions:
      '86843838398633638694688348468638494838968864334663986338366565575205330355220002075277362755725262077257206536037005626560263523352603353536266276603602213012131225103232101221232110222113130203125000503013115501213201023330111553050315022322225654663334242543234433232446526336343734656332344423774456646775667753474555237727426227443483698893863649649896633633688',
    temperatures:
      '.6.8:.:.:+.6::6:.6+86..:8.86.6:.8+8.:.+6..68::866;+.6:;/:6796999:?>;:;>:9;A??>>?=;9A::;8@<9<;C:@7A?<=B;=C>9;>9?==@A>:B<;;?C<?>C?>>B;@@@>@>?<B<<C=<<@@;ACCP@BPDN@ODC>NB?D?DNBNBDOD@CPMBDCCMP?O@BDA?ND>BAB=@>AO@NO>>AODM@C@MBA=>>@MLO<>?@<@?O=ABB>A@B@<;<:8;<<;:@;@;:<?<:8:=>=>8969>7:<6;:<9::698;:>:898>:99888768699866998:898888>:99>98>6>>988:8.:6+..+:.6:68+68+.+66::6::6..',
  },
  {
    seed: 0,
    year: 2026,
    conditions:
      '66648999949889933484864848896934833493988883864344386664849363377250565673070033766557270660556770733506533656262062036670075357250075062373507677235252320055303533135153052223053213030005333103515510022512525321220015533053555055035325325102046372252575423776526275223463342766574563775574573332624625343253547375557326664242355474564666686396938688883868963693998',
    temperatures:
      '6668.++++8+..++::8.8.68.8..+6+:8.::8+:+....:.78:88:.7668.8+;8:<99>:<86:79:=<>>=<;8::9;@<?8:>:;7;:?=?==@8<>=8<;B;CA<DA?<<<BB=<=<<B<BA=>A;C?>?>B><>>D@>D>C>DBB>>@B@>??N@=N>?B>CCC?B>>DP?B@B@B>@>@PB@<O>>PBACD<PB>D<>APCDA?L<=>??;?;>=A=>@?<<@:<B;K?@>:8;<@B;B;;;:@;;999A6A:9?@:96:;:@978:9997:9999989:;::>6>86?8:8:>8:889:98889:>6668>8>:888988686666.6:+6+:.6....:.6.+6:6+:++.',
  },
  {
    seed: 12345,
    year: 2025,
    conditions:
      '43448983394869933638933984683668346344694449869483963949964023523232362000377757272620502052566323666623237050725675333065223000037000656625537000050630502332315031353532533012315555511121112201500303030550030515513322512311205025350152003100563544636647322366322436777653266557543727637654553746222324532332333372747273337573745247523683643996349386469389338464396',
    temperatures:
      '8:88.+.::+8.6++::6:.+::+.86.:66.:86:896+888+.6+8.;+6;+8++68=?<:?;?<@;7?<>=<<9<::A:@8?>9=B@9A<89>A?:;::B>A>;A<?<D<9><>?=@:=DB?BB@B@=@B@;<:<D<>@>B@@@>B:?B>BC@@D?O>A@P?>@=@C>??BPD?P>>>>>OPPDMMPDDAP=AB@B@A?A<>BB@B=P<<N>@BC=MD>ONBA<?B>>;?N<BA?>L>A<8<<<;7<::<;=A?;77;@?;=9:::8:=?668:99:;:?96:969888:986>>>;>88:>::>::::9>989>9:::989:988>898>:6.:68:++6:8+:.686+:.+::.868:+6',
  },
  {
    seed: 12345,
    year: 2026,
    conditions:
      '89896989838436948336388466998686999936439999644494696999333622536622553670530033266267320035250372372350662766322603260620500636230722707577227636722335331115155250123235052352500522112110113300223331101351050051323052531133223500133522311313075676674253237474453627736245577277666527233452775246335557646443457733376454276325364234459394439366369986964364349886699',
    temperatures:
      '.+.+6+.+.:.8:6+8.::6:..866++.6.6++++:68:++++6888+87+7+++:<:6@@9:87@?99<7;>:;==;<?79?8;=A=>>;B:@<=A>=B>:@8;C;99>DD9A=B;?;DA=BA9?;D>A>BC>A=>==BD><?<>BC>@>@?PNP>P==D>APD@D>=A>D@>D>AB=DBNOCPPBOP@@ABCD>@>MPBP@>O@>BB<P>C>@>B=@NN?>CC><@@M@><CA>LO=M=@<=8;99=;@9;A<<::;9:<8A<:<7>;98;:>99688:>9>:;89?998?86::888968688:8899:::96888>96:>8:68>:888+:+88:+:66:6++.6+68:68:8+..66++',
  },
];

/**
 * Days whose output intentionally changed: the first day of a season where
 * yesterday's condition is out of season. The old adjacency fallback always
 * returned the first condition in the new season's pool.
 */
const ADJACENCY_FIX_DAYS: Record<number, string[]> = {
  0: ['2026-09-01'],
  12345: ['2025-03-01', '2025-06-01'],
};

function noon(year: number, dayIndex: number): Date {
  return new Date(year, 0, 1 + dayIndex, 12);
}

function isoDay(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${String(d.getFullYear())}-${mm}-${dd}`;
}

afterEach(() => {
  configureWeather(null);
});

describe('computeDayWeather without weather.json', () => {
  it('reproduces the pinned outputs for the same seed', () => {
    for (const { seed, year, conditions, temperatures } of PINNED) {
      for (let i = 0; i < 365; i++) {
        const date = noon(year, i);
        if (ADJACENCY_FIX_DAYS[seed].includes(isoDay(date))) continue;
        const w = computeDayWeather(date, seed);
        expect(
          `${isoDay(date)} ${w.conditionId} ${String(w.temperature)}`,
        ).toBe(
          `${isoDay(date)} ${BUILTIN_IDS[Number(conditions[i])]} ${String(temperatures.charCodeAt(i) - 48)}`,
        );
      }
    }
  });

  it('only changes days where the season turned (adjacency fallback fix)', () => {
    for (const [seed, days] of Object.entries(ADJACENCY_FIX_DAYS)) {
      for (const day of days) {
        const date = new Date(`${day}T12:00:00`);
        const prev = new Date(date);
        prev.setDate(prev.getDate() - 1);
        expect(getSeason(prev)).not.toBe(getSeason(date));
        const pinned = PINNED.find(
          (p) => p.seed === Number(seed) && p.year === date.getFullYear(),
        );
        const i = Math.round(
          (date.getTime() - noon(date.getFullYear(), 0).getTime()) / 86400000,
        );
        const old = BUILTIN_IDS[Number(pinned?.conditions[i])];
        expect(computeDayWeather(date, Number(seed)).conditionId).not.toBe(old);
      }
    }
  });

  it('drifts to the most similar in-season condition when the season turns', () => {
    // Seed 12345's last winter day rolled a winter-only condition; the old code
    // fell back to 'sunny' (spring pool[0]), now it drifts to wet weather.
    expect(
      computeDayWeather(new Date('2025-03-01T12:00:00'), 12345),
    ).toMatchObject({
      conditionId: 'rainy',
      seasonId: 'spring',
    });
  });
});

describe('computeDayWeather with weather.json', () => {
  const weights = {
    snowy: 0.05,
    freezing: 0.05,
    rainy: 0.3,
    overcast: 0.35,
    cloudy: 0.25,
  };

  it('matches the configured weights over a simulated year', () => {
    configureWeather(
      hydrateWeather({
        seasons: {
          winter: weights,
          spring: weights,
          summer: weights,
          autumn: weights,
        },
      }),
    );
    for (const seed of [1, 777, 4242]) {
      const counts: Record<string, number> = {};
      for (let i = 0; i < 365; i++) {
        const id = computeDayWeather(noon(2025, i), seed).conditionId;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      expect(Object.keys(counts).sort()).toEqual(Object.keys(weights).sort());
      for (const [id, weight] of Object.entries(weights)) {
        expect(Math.abs((counts[id] ?? 0) / 365 - weight)).toBeLessThan(0.07);
      }
    }
  });

  it('is deterministic for a seed', () => {
    configureWeather(hydrateWeather({ seasons: { winter: weights } }));
    const date = new Date('2025-01-15T12:00:00');
    expect(computeDayWeather(date, 9)).toEqual(computeDayWeather(date, 9));
  });

  it('keeps the built-in pool for seasons without weights', () => {
    configureWeather(hydrateWeather({ seasons: { winter: weights } }));
    const summer = new Set([
      'sunny',
      'hot_sunny',
      'partly_cloudy',
      'cloudy',
      'light_rain',
    ]);
    for (let i = 152; i < 243; i++) {
      expect(summer.has(computeDayWeather(noon(2025, i), 3).conditionId)).toBe(
        true,
      );
    }
  });

  it('defaults persistence to 0.65 and honours an explicit value', () => {
    const year = (): string[] =>
      Array.from(
        { length: 365 },
        (_, i) => computeDayWeather(noon(2025, i), 5).conditionId,
      );
    const builtin = year();
    configureWeather(hydrateWeather({}));
    expect(year()).toEqual(builtin);
    configureWeather(hydrateWeather({ persistence: 0.65 }));
    expect(year()).toEqual(builtin);
    configureWeather(hydrateWeather({ persistence: 0 }));
    expect(year()).not.toEqual(builtin);
  });

  it('rejects invalid weather.json', () => {
    expect(() => hydrateWeather({ persistence: 2 })).toThrow(/persistence/);
    expect(() =>
      hydrateWeather({ seasons: { winter: { blizzard: 1 } } }),
    ).toThrow(/unknown condition 'blizzard'/);
    expect(() =>
      hydrateWeather({ conditions: { blizzard: { label: 'Blizzard' } } }),
    ).toThrow(/needs label, tempMin and tempMax/);
    expect(() => hydrateWeather({ seasons: { winter: { snowy: 0 } } })).toThrow(
      /positive weight/,
    );
  });

  it('uses added conditions with their label and temperature range', () => {
    configureWeather(
      hydrateWeather({
        seasons: { summer: { heatwave: 1 } },
        conditions: {
          heatwave: { label: 'Heatwave', tempMin: 30, tempMax: 38 },
          sunny: { label: 'Bright' },
        },
      }),
    );
    const w = computeDayWeather(new Date('2025-07-10T12:00:00'), 1);
    expect(w.conditionId).toBe('heatwave');
    expect(w.condition.label).toBe('Heatwave');
    expect(w.temperature).toBeGreaterThanOrEqual(30);
    expect(w.temperature).toBeLessThanOrEqual(38);
  });
});
