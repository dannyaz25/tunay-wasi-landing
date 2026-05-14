import SupplyNav from '@/features/mayoristas/components/SupplyNav';
import SupplyHero from '@/features/mayoristas/components/SupplyHero';
import SupplyLotes from '@/features/mayoristas/components/SupplyLotes';
import SupplyProceso from '@/features/mayoristas/components/SupplyProceso';
import SupplyForm from '@/features/mayoristas/components/SupplyForm';
import { CafiFooter } from '@/features/caficultores/components/CafiFinalCTA';

export default function AppMayoristas() {
  return (
    <>
      <SupplyNav />
      <main>
        <SupplyHero />
        <SupplyLotes />
        <SupplyProceso />
        <SupplyForm />
      </main>
      <CafiFooter />
    </>
  );
}
