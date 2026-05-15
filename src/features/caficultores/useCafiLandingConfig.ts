import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from '@/features/catalog/catalogKeys';
import {
  fetchCafiLandingConfig,
  fetchPricing,
  STATIC_CAFI_LANDING,
  STATIC_PRICING,
} from '@/features/catalog/catalogService';

export interface CafiCalcTier {
  label: string;    // "82–83 pts"
  tunay: number;    // S/ per kg verde, e.g. 34.65
  acopMin: number;  // 12
  acopMax: number;  // 18
}

export interface CafiLandingData {
  waitlist: { maxSlots: number };
  calculator: {
    defaultKg: number;
    defaultTierIndex: number;
    sliderMinKg: number;
    sliderMaxKg: number;
    sliderStepKg: number;
    footnote: string;
    tiers: CafiCalcTier[];
  };
  hero: {
    minPricePerKg: number;  // S/ per kg verde (first tier)
    maxPricePerKg: number;  // S/ per kg verde (last tier)
    minScaLabel: string;    // "82 pts"
    maxScaLabel: string;    // "90+ pts"
  };
}

function tierLabel(scaMin: number, scaMax: number | null): string {
  if (scaMax === null) return `${Math.floor(scaMin)}+ pts`;
  return `${Math.floor(scaMin)}–${Math.floor(scaMax)} pts`;
}

function buildCafiLandingData(
  cafiCfg: Awaited<ReturnType<typeof fetchCafiLandingConfig>>,
  pricing: Awaited<ReturnType<typeof fetchPricing>>,
): CafiLandingData {
  const { calculator, waitlist } = cafiCfg;
  const tiers: CafiCalcTier[] = pricing.tiers.map((t, i) => ({
    label: tierLabel(t.scaMin, t.scaMax),
    tunay: t.caficultorPerKgCents / 100,
    acopMin: calculator.acopiadorRanges[i]?.acopMin ?? 0,
    acopMax: calculator.acopiadorRanges[i]?.acopMax ?? 0,
  }));

  const first = tiers[0];
  const last = tiers[tiers.length - 1];

  return {
    waitlist,
    calculator: {
      defaultKg: calculator.defaultKg,
      defaultTierIndex: calculator.defaultTierIndex,
      sliderMinKg: calculator.sliderMinKg,
      sliderMaxKg: calculator.sliderMaxKg,
      sliderStepKg: calculator.sliderStepKg,
      footnote: calculator.footnote,
      tiers,
    },
    hero: {
      minPricePerKg: first.tunay,
      maxPricePerKg: last.tunay,
      minScaLabel: `${Math.floor(pricing.tiers[0].scaMin)} pts`,
      maxScaLabel: `${Math.floor(pricing.tiers[pricing.tiers.length - 1].scaMin)}+ pts`,
    },
  };
}

export const STATIC_DATA = buildCafiLandingData(STATIC_CAFI_LANDING, STATIC_PRICING);

export function useCafiLandingConfig() {
  return useQuery({
    queryKey: catalogKeys.cafiLandingConfig(),
    queryFn: async () => {
      const [cafiCfg, pricing] = await Promise.all([
        fetchCafiLandingConfig(),
        fetchPricing(),
      ]);
      return buildCafiLandingData(cafiCfg, pricing);
    },
    staleTime: 10 * 60 * 1000,
    placeholderData: STATIC_DATA,
  });
}
