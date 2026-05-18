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
  Trash,
  Heart,
  Loader2,
  Eye
} from 'lucide-react';

// חיבור ל-Firebase
import { db, storage } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import bgImage from './assets/daniel_shalom.png';

const DancingCouple = () => (
  <motion.div 
    className="fixed bottom-10 right-10 z-40 hidden lg:block opacity-30 hover:opacity-100 transition-opacity duration-500"
    animate={{ rotate: [0, -5, 5, 0], y: [0, -10, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1">
      <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9Z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" /><circle cx="9" cy="9" r="0.1" fill="currentColor"/><circle cx="15" cy="9" r="0.1" fill="currentColor"/>
    </svg>
  </motion.div>
);

function App() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const fileInputRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // משיכת תמונות מ-Firebase
  useEffect(() => {
    if (!db) return;
    
    const q = query(collection(db, "wedding_images"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedImages = snapshot.docs.map(doc => ({
        url: doc.data().url,
        path: doc.data().path, // נתיב לשמירה מחיקה בטוחה
        id: doc.id 
      }));
      setImages(fetchedImages);
    });
    
    return () => unsubscribe();
  }, []);

  // הגנה: אם תמונה נמחקה והאינדקס חורג, סגור את החלון
  useEffect(() => {
    if (selectedImageIndex !== null && selectedImageIndex >= images.length) {
      setSelectedImageIndex(null);
    }
  }, [images.length, selectedImageIndex]);

  // העלאה ל-Firebase
  const handleUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    setUploading(true);
    try {
      const filePath = `wedding/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await addDoc(collection(db, "wedding_images"), {
        url,
        path: filePath,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Upload error:", error);
      alert("שגיאה בהעלאת התמונה.");
    } finally {
      setUploading(false);
    }
  };

  // מחיקה בטוחה מ-Firebase
  const handleDelete = async (image) => {
    if (!db || !image) return;
    if (!window.confirm("האם אתה בטוח שברצונך למחוק תמונה זו?")) return;

    setDeleting(true);
    try {
      // 1. מנסים למחוק מהאחסון (עטוף ב-try-catch כדי למנוע קריסה אם הקובץ כבר לא שם)
      try {
        if (image.path) {
          await deleteObject(ref(storage, image.path));
        } else if (image.url) {
          await deleteObject(ref(storage, image.url));
        }
      } catch (storageErr) {
        console.warn("הקובץ באחסון לא נמצא, ממשיך למחיקה מהמסד...", storageErr);
      }

      // 2. מוחקים מהמסד נתונים
      await deleteDoc(doc(db, "wedding_images", image.id));
      
      // 3. סוגרים את התצוגה המוגדלת
      closeLightbox();
    } catch (error) {
      console.error("Delete error:", error);
      alert("שגיאה במחיקת התמונה. נסה שוב.");
    } finally {
      setDeleting(false);
    }
  };

  const onFileChange = (e) => handleUpload(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files[0]);
  };

  // פונקציות ניווט מוגנות מפני התנגשויות
  const openLightbox = (index) => setSelectedImageIndex(index);
  const closeLightbox = () => setSelectedImageIndex(null);
  
  const showNextImage = (e) => { 
    if(e && e.stopPropagation) e.stopPropagation(); 
    setSelectedImageIndex((prev) => (prev + 1) % images.length); 
  };
  
  const showPrevImage = (e) => { 
    if(e && e.stopPropagation) e.stopPropagation(); 
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length); 
  };

  const handleDownloadClick = (e, url) => {
    if(e && e.stopPropagation) e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `wedding-photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // תמיכה בחיצים במקלדת
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); showNextImage(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); showPrevImage(); }
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, images.length]);

  return (
    <div className="min-h-screen bg-[#fafaf8] text-stone-800 font-['Heebo'] selection:bg-[#d4af37] selection:text-white">
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-[#d4af37] z-[100] origin-right" style={{ scaleX }} />
      <DancingCouple />

      {/* Hero Section */}
      <header className="relative w-full h-[70vh] flex flex-col items-center justify-center overflow-hidden bg-stone-900 shadow-xl pb-20">
        <div className="absolute inset-0 z-0">
          <img src={bgImage} alt="Wedding" className="w-full h-full object-cover opacity-70" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#fafaf8] z-[1]"></div>
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="z-10 text-center px-4">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }} className="inline-block mb-6">
            <Heart className="text-[#d4af37] fill-[#d4af37]" size={48} />
          </motion.div>
          <h1 className="text-6xl md:text-9xl font-black text-white mb-4 drop-shadow-2xl">דניאל & שלום</h1>
          <p className="text-2xl md:text-4xl text-stone-200 font-light tracking-[0.3em] uppercase">מתחתנים</p>
        </motion.div>
      </header>

      {/* Upload Section */}
      <section className="max-w-6xl mx-auto py-24 px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-[4rem] p-12 md:p-20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-stone-50 text-center relative overflow-hidden">
          <h3 className="text-4xl md:text-6xl font-black mb-6 text-stone-900">הוסיפו תמונה לאלבום</h3>
          <p className="text-xl md:text-2xl text-stone-500 mb-12">התמונות שלכם יופיעו כאן בגלריה באופן מיידי עבור כולם!</p>
          
          <div 
            className={`border-4 border-dashed rounded-[3rem] p-16 md:p-24 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-8 ${isDragging ? 'border-[#d4af37] bg-[#d4af37]/10 scale-105' : 'border-stone-200 hover:border-[#d4af37] hover:bg-stone-50'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current.click()}
          >
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} disabled={uploading} />
            {uploading ? (
              <Loader2 className="text-[#d4af37] animate-spin" size={80} />
            ) : (
              <UploadCloud className="text-[#d4af37] animate-pulse" size={80} />
            )}
            <span className="text-2xl md:text-5xl font-black text-stone-700 leading-tight">
              {uploading ? "מעלה תמונה לאלבום המשותף..." : "לחצו לבחירה או גררו לכאן"}
            </span>
          </div>
        </motion.div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-[95rem] mx-auto py-32 px-6">
        <div className="flex items-center gap-6 mb-20">
          <div className="h-px bg-stone-300 flex-1"></div>
          <h3 className="text-4xl md:text-6xl font-black text-center flex items-center gap-4 text-stone-900">
            הגלריה שלנו
            <ImageIcon className="text-[#d4af37]" size={40} />
          </h3>
          <div className="h-px bg-stone-300 flex-1"></div>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-stone-200 shadow-sm">
            <p className="text-stone-400 italic text-2xl font-light">עדיין אין תמונות, תהיו הראשונים!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {images.map((image, index) => (
              <motion.div 
                key={image.id || index} 
                initial={{ opacity: 0, scale: 0.9 }} 
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="aspect-square overflow-hidden rounded-[1.5rem] shadow-sm hover:shadow-xl border-2 border-white cursor-pointer relative group bg-stone-100"
                onClick={() => openLightbox(index)}
              >
                <img src={image.url} alt="Wedding Moment" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                
                {/* Overlay Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openLightbox(index); }}
                    className="p-3 bg-white/90 text-stone-900 rounded-full hover:bg-[#d4af37] hover:text-white transition-colors shadow-lg"
                    title="הגדל תמונה"
                  >
                    <Eye size={24} />
                  </button>
                  <button 
                    onClick={(e) => handleDownloadClick(e, image.url)}
                    className="p-3 bg-white/90 text-stone-900 rounded-full hover:bg-[#d4af37] hover:text-white transition-colors shadow-lg"
                    title="הורד תמונה למכשיר"
                  >
                    <Download size={24} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-20 text-center bg-white border-t border-stone-100 mt-10">
        <Heart className="mx-auto text-[#d4af37] mb-4" fill="#d4af37" size={32} />
        <h2 className="text-2xl font-black mb-1">תודה שחגגתם איתנו!</h2>
        <p className="text-stone-400">דניאל ושלום נחיאס</p>
      </footer>

      {/* Lightbox Modal (התצוגה המוגדלת) */}
      <AnimatePresence>
        {selectedImageIndex !== null && images[selectedImageIndex] && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-black/98 flex flex-col items-center justify-center backdrop-blur-2xl" 
            onClick={closeLightbox}
          >
            {/* Toolbar עליון */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => handleDelete(images[selectedImageIndex])} 
                  disabled={deleting} 
                  className="p-3 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all flex items-center justify-center shadow-lg"
                  title="מחק תמונה זו"
                >
                  {deleting ? <Loader2 className="animate-spin" size={24} /> : <Trash size={24} />}
                </button>
                
                <a 
                  href={images[selectedImageIndex].url} 
                  download={`wedding-photo.jpg`} 
                  className="p-3 bg-white/10 hover:bg-[#d4af37] text-white rounded-full transition-all flex items-center justify-center shadow-lg border border-white/20"
                  title="הורד תמונה"
                >
                  <Download size={24} />
                </a>
              </div>

              {/* מונה תמונות */}
              <div className="text-white/80 font-medium tracking-widest bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">
                {selectedImageIndex + 1} / {images.length}
              </div>

              {/* כפתור סגירה */}
              <button onClick={closeLightbox} className="p-3 bg-white/10 hover:bg-white/30 text-white rounded-full transition-all shadow-lg border border-white/20">
                <X size={28} />
              </button>
            </div>

            {/* התמונה המוגדלת */}
            <div className="relative w-full h-full flex items-center justify-center px-4 md:px-20 mt-10">
              <motion.img 
                key={images[selectedImageIndex].id || selectedImageIndex}
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={images[selectedImageIndex].url} 
                className="max-h-[80vh] max-w-full rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/10" 
                onClick={(e) => e.stopPropagation()} 
              />
            </div>

            {/* חצים לדפדוף ימינה ושמאלה */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={showNextImage} 
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-4 md:p-6 bg-white/5 hover:bg-white/20 rounded-full backdrop-blur-lg transition-all border border-white/10"
                >
                  <ChevronLeft size={48} />
                </button>
                <button 
                  onClick={showPrevImage} 
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-4 md:p-6 bg-white/5 hover:bg-white/20 rounded-full backdrop-blur-lg transition-all border border-white/10"
                >
                  <ChevronRight size={48} />
                </button>
              </>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;