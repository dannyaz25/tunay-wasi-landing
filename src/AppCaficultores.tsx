import CafiNav from '@/features/caficultores/components/CafiNav';
import CafiHero from '@/features/caficultores/components/CafiHero';
import CafiCalculator from '@/features/caficultores/components/CafiCalculator';
import CafiBeneficios from '@/features/caficultores/components/CafiBeneficios';
import CafiLista from '@/features/caficultores/components/CafiLista';
import CafiFAQ from '@/features/caficultores/components/CafiFAQ';
import { CafiFinalCTA, CafiFooter } from '@/features/caficultores/components/CafiFinalCTA';

export default function AppCaficultores() {
  return (
    <>
      <CafiNav />
      <main>
        <CafiHero />
        <CafiCalculator />
        <CafiBeneficios />
        <CafiLista />
        <CafiFAQ />
        <CafiFinalCTA />
      </main>
      <CafiFooter />
    </>
  );
}
