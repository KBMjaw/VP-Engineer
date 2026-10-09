import { useEffect } from 'react';
import { FloatingWhatsApp, Footer, Navbar } from '../components/site/Chrome';
import { About, Contact, Hero, Intro, Services, Why } from '../components/site/Sections';
import { Journey } from '../components/journey/Journey';
import { Portfolio } from '../components/portfolio/Portfolio';
import { useReveal } from '../hooks/useReveal';
import { SITE } from '../config/site';

export default function Home() {
  useReveal();
  useEffect(() => {
    document.title = `${SITE.name} | Civil & Structural Engineering, Erode`;
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Intro />
        <About />
        <Services />
        <Journey />
        <Portfolio />
        <Why />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
