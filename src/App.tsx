import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Origen from '@/components/sections/Origen';
import Historia from '@/components/sections/Historia';
import Modelo from '@/components/sections/Modelo';
import CartButton from '@/components/cart/CartButton';
import CartDrawer from '@/components/cart/CartDrawer';
import Preventa from '@/features/preventa/components/Preventa';
import Caficultores from '@/features/catalog/components/Caficultores';
import Cafe from '@/features/catalog/components/Cafe';
import Contacto from '@/features/contact/components/Contacto';
import Checkout from '@/features/checkout/components/Checkout';
import GrainOverlay from '@/components/decor/GrainOverlay';

export default function App() {
  return (
    <>
      <GrainOverlay/>
      <Nav/>
      <main>
        <Hero/>
        <Preventa/>
        <Origen/>
        <Caficultores/>
        <Cafe/>
        <Modelo/>
        <Historia/>
        <Contacto/>
      </main>
      <Footer/>
      <CartButton/>
      <CartDrawer/>
      <Checkout/>
    </>
  );
}
