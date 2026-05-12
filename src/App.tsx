import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import HeroCaficultor from '@/components/sections/HeroCaficultor';
import Origen from '@/components/sections/Origen';
import ModeloCaficultor from '@/components/sections/ModeloCaficultor';
import FAQ from '@/components/sections/FAQ';
import RegistroMicrolote from '@/components/sections/RegistroMicrolote';
import Contacto from '@/features/contact/components/Contacto';
import GrainOverlay from '@/components/decor/GrainOverlay';

export default function App() {
  return (
    <>
      <GrainOverlay/>
      <Nav/>
      <main>
        <HeroCaficultor/>
        <Origen/>
        <ModeloCaficultor/>
        <FAQ/>
        <RegistroMicrolote/>
        <Contacto/>
      </main>
      <Footer/>
    </>
  );
}
