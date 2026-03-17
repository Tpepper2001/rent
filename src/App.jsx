import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  Dna, 
  Globe, 
  Cpu, 
  TrendingUp, 
  BookOpen, 
  MessageSquare, 
  ArrowRight, 
  Github, 
  Linkedin, 
  Twitter,
  ExternalLink,
  Layers
} from 'lucide-react';

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// --- COMPONENTS ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-black/10 border-b border-white/10">
    <motion.div 
      initial={{ x: -20, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }}
      className="text-xl font-bold tracking-tighter text-white"
    >
      TOYIN<span className="text-gold-500 text-emerald-500">.ISHOLA</span>
    </motion.div>
    <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-300">
      {['Research', 'Portfolio', 'FinTech Lab', 'Insights'].map((item) => (
        <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-emerald-400 transition-colors">{item}</a>
      ))}
    </div>
    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105">
      Collaborate
    </button>
  </nav>
);

const Hero = () => (
  <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
    {/* Animated Background Gradients */}
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
    
    <div className="container mx-auto px-6 z-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <span className="inline-block py-1 px-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-4">
          BIOINFORMATICS • FINTECH • STORYTELLING
        </span>
        <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tight">
          Research. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Innovation.</span> <br /> Impact.
        </h1>
        <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl mb-10">
          Bridging the gap between academic excellence and technological execution. 
          Building ecosystems for environmental health and financial inclusion.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <button className="px-8 py-4 bg-white text-black font-bold rounded-lg flex items-center justify-center hover:bg-emerald-400 transition-colors group">
            Explore My Work <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </button>
          <button className="px-8 py-4 border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-colors">
            View Publications
          </button>
        </div>
      </motion.div>
    </div>

    {/* Scroll Indicator */}
    <motion.div 
      animate={{ y: [0, 10, 0] }} 
      transition={{ repeat: Infinity, duration: 2 }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
    >
      <div className="w-[1px] h-12 bg-gradient-to-b from-emerald-500 to-transparent mx-auto" />
    </motion.div>
  </section>
);

const ResearchSection = () => {
  const papers = [
    { title: "Phytoremediation of Contaminants", cat: "Environmental Science", icon: <Globe size={20}/> },
    { title: "Bioinformatics in Health Governance", cat: "Health Studies", icon: <Dna size={20}/> },
    { title: "FinTech Opportunities in Emerging Markets", cat: "Economics", icon: <TrendingUp size={20}/> },
  ];

  return (
    <section id="research" className="py-24 bg-[#080808]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <h2 className="text-emerald-500 font-mono text-sm mb-2 uppercase tracking-widest font-bold">Academic Repository</h2>
            <h3 className="text-4xl font-bold text-white">Featured Publications</h3>
          </div>
          <button className="text-gray-400 hover:text-white flex items-center mt-4 md:mt-0">
            View all papers <ExternalLink className="ml-2" size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {papers.map((paper, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              className="p-8 rounded-2xl bg-[#111] border border-white/5 hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              <div className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform">{paper.icon}</div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{paper.cat}</span>
              <h4 className="text-xl font-bold text-white mt-2 mb-4 leading-snug">{paper.title}</h4>
              <div className="flex space-x-4 mt-6">
                <span className="text-xs text-emerald-400 font-mono underline">ABSTRACT</span>
                <span className="text-xs text-gray-500 font-mono underline">PDF DOWNLOAD</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FintechLab = () => (
  <section id="fintech lab" className="py-24 bg-black relative overflow-hidden">
    {/* Blueprint Grid Background */}
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
    
    <div className="container mx-auto px-6 relative z-10">
      <div className="max-w-4xl">
        <h2 className="text-blue-500 font-mono text-sm mb-2 uppercase tracking-widest font-bold">Innovation Hub</h2>
        <h3 className="text-5xl font-bold text-white mb-8">The FinTech Lab</h3>
        <p className="text-gray-400 text-xl mb-12">
          Developing digital product ecosystems like the <span className="text-white font-bold">AJO platform</span> and <span className="text-white font-bold">ContributTech</span>—reimaging traditional savings for the digital age.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="border-l-2 border-emerald-500 pl-6 space-y-4">
            <h4 className="text-white font-bold text-xl uppercase tracking-tighter">Current MVP: Anonymous VoiceShare</h4>
            <p className="text-gray-400">A WordPress plugin designed for secure, untraceable storytelling and whistleblowing within corporate ecosystems.</p>
            <button className="text-emerald-400 font-bold flex items-center group">
              View Roadmap <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16}/>
            </button>
          </div>
          <div className="border-l-2 border-blue-500 pl-6 space-y-4">
            <h4 className="text-white font-bold text-xl uppercase tracking-tighter">Scholarly PDF Fetcher AI</h4>
            <p className="text-gray-400">Automating the retrieval of academic resources using AI-driven API calls to global repositories.</p>
            <button className="text-blue-400 font-bold flex items-center group">
              Try Prototype <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-12 border-t border-white/10 bg-[#050505]">
    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
      <div className="mb-6 md:mb-0">
        <p className="text-gray-500 text-sm italic">"African-rooted, globally competitive."</p>
        <p className="text-gray-400 text-xs mt-2">© 2024 Oluwatoyin Ishola. All Rights Reserved.</p>
      </div>
      <div className="flex space-x-6">
        <Github className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={20}/>
        <Linkedin className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={20}/>
        <Twitter className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={20}/>
      </div>
    </div>
  </footer>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div className="bg-black text-white selection:bg-emerald-500/30">
      {/* Top Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-emerald-500 origin-left z-[60]" style={{ scaleX }} />
      
      <Navbar />
      
      <main>
        <Hero />
        
        {/* About Teaser / Stats */}
        <section className="py-20 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Published Papers', val: '12+' },
                { label: 'Tech Projects', val: '08' },
                { label: 'SDG Initiatives', val: '05' },
                { label: 'Years Experience', val: '04' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-black text-white">{stat.val}</div>
                  <div className="text-gray-500 text-xs uppercase tracking-widest mt-1 font-bold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ResearchSection />
        
        <FintechLab />

        {/* Call to Action Section */}
        <section className="py-24 bg-gradient-to-b from-black to-emerald-950/20 text-center">
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }}
            className="container mx-auto px-6"
          >
            <h2 className="text-4xl font-bold mb-8">Have a project in mind?</h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto">
              Whether it's academic collaboration, software development, or storytelling—let's build something impactful.
            </p>
            <a 
              href="mailto:hello@toyinishola.com"
              className="inline-block px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-full transition-all"
            >
              Get In Touch
            </a>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}