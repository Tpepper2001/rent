import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dna, Globe, Cpu, TrendingUp, BookOpen, 
  ArrowRight, Github, Linkedin, Mail, ExternalLink, 
  Layers, Beaker, Zap, Shield
} from 'lucide-react';

// --- INLINE GLOBAL CSS ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Space+Grotesk:wght@300;500;700&display=swap');
    
    :root {
      --bg: #050505;
      --accent: #10b981; /* Emerald 500 */
      --secondary: #3b82f6; /* Blue 500 */
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg);
      color: white;
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
    }

    h1, h2, h3, h4 {
      font-family: 'Space Grotesk', sans-serif;
    }

    .glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .hero-glow {
      position: absolute;
      width: 40vw;
      height: 40vw;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(5, 5, 5, 0) 70%);
      filter: blur(60px);
      z-index: -1;
    }

    ::-webkit-scrollbar {
      width: 5px;
    }
    ::-webkit-scrollbar-track {
      background: #050505;
    }
    ::-webkit-scrollbar-thumb {
      background: #222;
      border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--accent);
    }
  `}} />
);

// --- COMPONENTS ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 px-6 py-5 flex justify-between items-center glass">
    <div className="text-xl font-bold tracking-tighter uppercase">
      Toyin<span className="text-emerald-500">.Ishola</span>
    </div>
    <div className="hidden md:flex space-x-8 text-xs font-bold uppercase tracking-widest text-gray-400">
      <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
      <a href="#research" className="hover:text-emerald-400 transition-colors">Research</a>
      <a href="#fintech" className="hover:text-emerald-400 transition-colors">FinTech Lab</a>
      <a href="#contact" className="hover:text-emerald-400 transition-colors">Contact</a>
    </div>
    <button className="bg-white text-black px-5 py-2 rounded-full text-xs font-black hover:bg-emerald-500 hover:text-white transition-all">
      COLLABORATE
    </button>
  </nav>
);

const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center pt-20">
    <div className="hero-glow" style={{ top: '-10%', left: '10%' }} />
    <div className="hero-glow" style={{ bottom: '0%', right: '0%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(5, 5, 5, 0) 70%)' }} />
    
    <div className="container mx-auto px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-8">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Available for Innovation 2024</span>
        </div>
        
        <h1 className="text-6xl md:text-9xl font-black mb-8 tracking-tighter leading-[0.9]">
          RESEARCH.<br />
          <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}>INNOVATION.</span><br />
          IMPACT.
        </h1>
        
        <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-12 font-light leading-relaxed">
          Bridging the gap between academic research in <span className="text-white">Bioinformatics</span> and 
          disruptive <span className="text-white">FinTech ecosystems</span>. 
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <button className="w-full md:w-auto px-10 py-5 bg-emerald-600 rounded-xl font-bold flex items-center justify-center hover:bg-emerald-500 transition-all group">
            View Research <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
          </button>
          <button className="w-full md:w-auto px-10 py-5 glass rounded-xl font-bold hover:bg-white/10 transition-all">
            The FinTech Lab
          </button>
        </div>
      </motion.div>
    </div>
  </section>
);

const SectionHeading = ({ subtitle, title }) => (
  <div className="mb-16">
    <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">{subtitle}</span>
    <h2 className="text-4xl md:text-5xl font-bold mt-2">{title}</h2>
  </div>
);

const ResearchSection = () => {
  const papers = [
    { title: "Phytoremediation of Contaminants", tag: "Env Science", icon: <Globe size={24} /> },
    { title: "Bioinformatics in Public Health", tag: "Health", icon: <Dna size={24} /> },
    { title: "Digital Ajo: Modernizing Savings", tag: "FinTech", icon: <TrendingUp size={24} /> },
  ];

  return (
    <section id="research" className="py-24">
      <div className="container mx-auto px-6">
        <SectionHeading subtitle="Academic Archive" title="Selected Publications" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {papers.map((p, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-10 rounded-3xl glass hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                {p.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{p.tag}</span>
              <h3 className="text-2xl font-bold mt-4 mb-8 leading-tight">{p.title}</h3>
              <div className="flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-2 transition-transform">
                READ ABSTRACT <ArrowRight size={14} className="ml-2" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinTechLab = () => (
  <section id="fintech" className="py-24 relative overflow-hidden">
    <div className="container mx-auto px-6">
      <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-zinc-900 to-black border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Layers size={200} />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <SectionHeading subtitle="Innovation Lab" title="The Future of Financial Tools" />
          <p className="text-gray-400 text-lg mb-12">
            Currently developing high-impact tools for the digital economy. From automated research fetchers 
            to peer-to-peer contribution systems.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="text-blue-500 flex items-center space-x-2">
                <Shield size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Live Concept</span>
              </div>
              <h4 className="text-xl font-bold italic">Anonymous VoiceShare</h4>
              <p className="text-gray-500 text-sm">A secure WordPress plugin for untraceable feedback and whistleblowing.</p>
            </div>
            <div className="space-y-4">
              <div className="text-emerald-500 flex items-center space-x-2">
                <Beaker size={20} /> <span className="text-xs font-bold uppercase tracking-widest">In Development</span>
              </div>
              <h4 className="text-xl font-bold italic">Scholarly PDF AI</h4>
              <p className="text-gray-500 text-sm">LLM-powered tool to automate academic resource discovery.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer id="contact" className="py-20 border-t border-white/5 mt-20">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold mb-8 italic">Let's build the future together.</h2>
      <div className="flex justify-center space-x-8 mb-12">
        <a href="#" className="p-4 glass rounded-full hover:text-emerald-500 transition-colors"><Github /></a>
        <a href="#" className="p-4 glass rounded-full hover:text-emerald-500 transition-colors"><Linkedin /></a>
        <a href="#" className="p-4 glass rounded-full hover:text-emerald-500 transition-colors"><Mail /></a>
      </div>
      <p className="text-gray-600 text-xs tracking-[0.4em] uppercase font-bold">Oluwatoyin Ishola • 2024</p>
    </div>
  </footer>
);

// --- MAIN APP ---
export default function App() {
  return (
    <div className="min-h-screen">
      <GlobalStyles />
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Bio Section */}
        <section id="about" className="py-24 glass">
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="w-full aspect-square rounded-[60px] bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center">
                <Dna size={120} className="text-emerald-500 opacity-20" />
              </div>
              <div className="absolute -bottom-6 -right-6 p-8 glass rounded-3xl">
                <div className="text-4xl font-black text-white">04+</div>
                <div className="text-[10px] text-emerald-500 font-bold uppercase">Years Excellence</div>
              </div>
            </div>
            <div>
              <SectionHeading subtitle="Profile" title="Researcher. Developer. Storyteller." />
              <p className="text-gray-400 leading-loose mb-8">
                With a foundation in Environmental Science from Kaduna State University and a career 
                built on digital transformation, I specialize in multidisciplinary problem-solving. 
                Whether as an Editor-in-Chief or an SDG Ambassador, my focus remains the same: 
                using technology to amplify human impact.
              </p>
              <button className="flex items-center font-bold text-sm border-b-2 border-emerald-500 pb-2 hover:text-emerald-500 transition-all">
                DOWNLOAD FULL CV <ExternalLink size={16} className="ml-2" />
              </button>
            </div>
          </div>
        </section>

        <ResearchSection />
        
        <FinTechLab />
      </main>

      <Footer />
    </div>
  );
}