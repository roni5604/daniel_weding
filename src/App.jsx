// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Calendar, 
  MapPin, 
  Clock, 
  Heart 
} from 'lucide-react';

// ייבוא התמונה - וודא שהיא ב-src/assets/daniel_shalom.png
import bgImage from './assets/daniel_shalom.png';

// רכיב אנימציית זוג רוקד בצד
const DancingCouple = () => (
  <motion.div 
    className="fixed bottom-10 right-10 z-40 hidden lg:block opacity-20 hover:opacity-100 transition-opacity duration-500"
    animate={{ 
      rotate: [0, -5, 5, 0],
      y: [0, -10, 0]
    }}
    transition={{ 
      duration: 4, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
  >
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9Z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
      <path d="M10 18h4" />
    </svg>
    <p className="text-[#d4af37] text-xs text-center font-bold mt-2">D & S</p>
  </motion.div>
);

function App() {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const fileInputRef = useRef(null);

  // אפקט פס התקדמות בראש האתר
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      setImages((prev) => [imageUrl, ...prev]);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const openLightbox = (index) => setSelectedImageIndex(index);
  const closeLightbox = () => setSelectedImageIndex(null);
  
  const showNextImage = (e) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const showPrevImage = (e) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'ArrowLeft') showNextImage(e);
      if (e.key === 'ArrowRight') showPrevImage(e);
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, images.length]);

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-stone-800 font-['Heebo'] selection:bg-[#d4af37] selection:text-white">
      
      {/* פס התקדמות עליון */}
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-[#d4af37] z-[100] origin-right" style={{ scaleX }} />

      <DancingCouple />

      {/* Hero Section - מוקטן ומרשים */}
      <header className="relative w-full h-[65vh] flex flex-col items-center justify-center overflow-hidden bg-stone-900 shadow-xl">
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.5 }}
        >
          <img src={bgImage} alt="Background" className="w-full h-full object-cover opacity-80" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-[#fcfbf7] z-[1]"></div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="z-10 text-center px-4"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <Heart className="text-[#d4af37] fill-[#d4af37]" size={40} />
          </motion.div>
          <h1 className="text-6xl md:text-9xl font-black text-white mb-4 drop-shadow-2xl">
            דניאל & שלום
          </h1>
          <p className="text-xl md:text-3xl text-stone-200 font-light tracking-[0.3em] uppercase">
            מתחתנים
          </p>
        </motion.div>
      </header>

      {/* מקטע מידע על האירוע - מוסיף נפח */}
      <section className="max-w-7xl mx-auto py-20 px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { icon: <Calendar />, title: "מתי?", desc: "15.06.2026" },
          { icon: <Clock />, title: "שעה", desc: "19:30 - קבלת פנים" },
          { icon: <MapPin />, title: "איפה?", desc: "האחוזה, בית חנן" }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 text-center hover:shadow-md transition-shadow"
          >
            <div className="text-[#d4af37] flex justify-center mb-4">{item.icon}</div>
            <h4 className="text-xl font-bold mb-2">{item.title}</h4>
            <p className="text-stone-500 text-lg">{item.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* אזור העלאת התמונות - גדול, ברור ומרשים */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-white to-stone-50 rounded-[4rem] p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-white text-center relative overflow-hidden"
        >
          {/* אפקט עיצובי ברקע המקטע */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
              className="inline-block bg-[#d4af37] text-white p-6 rounded-full shadow-2xl mb-8"
            >
              <UploadCloud size={60} />
            </motion.div>
            
            <h3 className="text-5xl md:text-7xl font-black mb-6 text-stone-900">הוסיפו תמונה לאלבום</h3>
            <p className="text-xl md:text-2xl text-stone-500 mb-16 max-w-3xl mx-auto leading-relaxed">
              התמונות שלכם הן המזכרת הכי יפה שלנו. העלו אותן עכשיו והן יופיעו בגלריה המשותפת באופן מיידי!
            </p>
            
            <div 
              className={`border-4 border-dashed rounded-[3rem] p-24 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-8 ${isDragging ? 'border-[#d4af37] bg-[#d4af37]/10 scale-105' : 'border-stone-200 hover:border-[#d4af37] hover:bg-white shadow-inner'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} />
              <span className="text-3xl md:text-5xl font-black text-stone-700">לחצו לבחירת תמונה או גררו לכאן</span>
              <div className="flex items-center gap-4 text-[#d4af37] font-bold text-xl">
                <div className="h-px w-12 bg-[#d4af37]"></div>
                <span>שתפו את השמחה</span>
                <div className="h-px w-12 bg-[#d4af37]"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* גלריית התמונות המורחבת */}
      <section className="max-w-[90rem] mx-auto py-32 px-6">
        <div className="text-center mb-24">
          <motion.h3 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-5xl md:text-7xl font-black text-stone-900 mb-6"
          >
            הגלריה שלנו
          </motion.h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-[#d4af37]/30"></div>)}
          </div>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-32 bg-stone-100/30 rounded-[3rem] border-2 border-dashed border-stone-200">
            <p className="text-stone-400 text-2xl italic font-light">אנחנו מחכים לתמונה הראשונה שלכם...</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-4 gap-8 space-y-8">
            {images.map((imgSrc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="break-inside-avoid rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 relative group cursor-pointer border-4 border-white"
                onClick={() => openLightbox(index)}
              >
                <img src={imgSrc} alt="Wedding moment" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                   <ImageIcon className="text-white mb-2" size={32} />
                   <span className="text-white font-bold">הגדלה</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* פוטר - מוסיף רמה מקצועית */}
      <footer className="py-20 text-center bg-white border-t border-stone-100">
        <Heart className="mx-auto text-[#d4af37] mb-6" fill="#d4af37" />
        <h2 className="text-3xl font-black mb-2">תודה שחגגתם איתנו!</h2>
        <p className="text-stone-400">דניאל ושלום נחיאס | 2026</p>
      </footer>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 md:p-10 backdrop-blur-2xl"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute top-10 right-10 text-white hover:text-[#d4af37] transition-all p-4 z-[110] bg-white/5 rounded-full">
              <X size={44} />
            </button>

            <a 
              href={images[selectedImageIndex]} 
              download={`wedding-${selectedImageIndex}.jpg`}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-10 left-10 text-white p-4 bg-white/10 rounded-2xl flex items-center gap-3 backdrop-blur-md hover:bg-[#d4af37] transition-all"
            >
              <Download size={32} />
              <span className="hidden md:inline font-bold">שמור תמונה</span>
            </a>

            {images.length > 1 && (
              <>
                <button onClick={showPrevImage} className="absolute right-4 md:right-10 text-white hover:text-[#d4af37] p-4 bg-white/5 rounded-full backdrop-blur-md">
                  <ChevronRight size={60} />
                </button>
                <button onClick={showNextImage} className="absolute left-4 md:left-10 text-white hover:text-[#d4af37] p-4 bg-white/5 rounded-full backdrop-blur-md">
                  <ChevronLeft size={60} />
                </button>
              </>
            )}

            <motion.img 
              key={selectedImageIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              src={images[selectedImageIndex]} 
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border-2 border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
