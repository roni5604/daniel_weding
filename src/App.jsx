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

  // משיכת תמונות מ-Firebase בזמן אמת
  useEffect(() => {
    if (!db) return;
    
    const q = query(collection(db, "wedding_images"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedImages = snapshot.docs.map(doc => ({
        url: doc.data().url,
        path: doc.data().path, 
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

  // מחיקה בטוחה מ-Firebase (אחסון ומסד יחד)
  const handleDelete = async (image) => {
    if (!db || !storage || !image) return;
    if (!window.confirm("🗑️ האם אתה בטוח שברצונך למחוק תמונה זו מהאלבום של כולם?")) return;

    setDeleting(true);
    try {
      // 1. מנסים למחוק מהאחסון
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

  // פונקציית הורדה משופרת
  const handleDownloadClick = async (e, url) => {
    if(e && e.stopPropagation) e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `wedding-photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // במקרה של שגיאת CORS, נפתח רגיל
      const link = document.createElement('a');
      link.href = url;
      link.target = "_blank";
      link.download = `wedding-photo.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
            className={`border-4 border-dashed rounded-[3rem] p-12 md:p-20 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-6 ${isDragging ? 'border-[#d4af37] bg-[#d4af37]/10 scale-105' : 'border-stone-200 hover:border-[#d4af37] hover:bg-stone-50'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current.click()}
          >
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} disabled={uploading} />
            {uploading ? (
              <Loader2 className="text-[#d4af37] animate-spin" size={64} />
            ) : (
              <UploadCloud className="text-[#d4af37] animate-pulse" size={64} />
            )}
            <span className="text-2xl md:text-4xl font-black text-stone-700 leading-tight">
              {uploading ? "מעלה תמונה לאלבום המשותף..." : "לחצו לבחירה או גררו לכאן"}
            </span>
          </div>
        </motion.div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-[100rem] mx-auto py-32 px-4 md:px-6">
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-5">
            {images.map((image, index) => (
              <motion.div 
                key={image.id || index} 
                initial={{ opacity: 0, scale: 0.9 }} 
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                // ✅ לחיצה על כל נקודה בריבוע התמונה בגלריה תפתח אותה בגדול
                className="aspect-square overflow-hidden rounded-2xl md:rounded-[1.5rem] shadow-sm hover:shadow-xl border-2 border-white cursor-pointer relative group bg-stone-100"
                onClick={() => openLightbox(index)}
              >
                {/* 🛡️ מנגנון חכם: אם תמונה נמחקה מה-Storage אבל נשארה ב-Firestore, האתר פשוט מסתיר אותה */}
                <img 
                    src={image.url} 
                    alt="Wedding Moment" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.closest('div').style.display = 'none'; 
                    }}
                />
                
                {/* Overlay Hover על התמונות הקטנות */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
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

      {/* Lightbox Modal (תצוגת מסך מלא) */}
      <AnimatePresence>
        {selectedImageIndex !== null && images[selectedImageIndex] && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-black/98 flex flex-col items-center justify-center backdrop-blur-2xl" 
            onClick={closeLightbox}
          >
            {/* סרגל עליון מסודר: מונה תמונות ויציאה */}
            <div className="absolute top-0 w-full p-4 md:p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
              
              {/* מונה תמונות */}
              <div className="text-white/80 font-bold tracking-widest bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 text-sm md:text-base shadow-inner">
                {selectedImageIndex + 1} / {images.length}
              </div>

              {/* כפתור סגירה משופר: עם כיתוב "חזרה לאתר" */}
              <button 
                onClick={closeLightbox} 
                className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all backdrop-blur-md border border-white/10 shadow-lg"
              >
                <span className="hidden md:inline font-bold pr-1">חזרה לאתר</span>
                <X size={28} />
              </button>
            </div>

            {/* התמונה במרכז */}
            <div className="relative w-full h-full flex items-center justify-center px-4 md:px-20 mt-10 mb-20">
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

            {/* חצים לדפדוף ימינה ושמאלה בצדדים */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={showNextImage} 
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-4 md:p-6 bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-lg transition-all border border-white/10 z-50"
                >
                  <ChevronLeft size={48} />
                </button>
                <button 
                  onClick={showPrevImage} 
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-4 md:p-6 bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-lg transition-all border border-white/10 z-50"
                >
                  <ChevronRight size={48} />
                </button>
              </>
            )}

            {/* 🛡️ סרגל לחצנים תחתון יוקרתי קבוע - בולט ונוח מעל כל תמונה */}
            <div className="fixed bottom-0 w-full p-6 md:p-8 flex justify-center gap-6 md:gap-10 z-50 bg-gradient-to-t from-black/90 to-transparent" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => handleDelete(images[selectedImageIndex])} 
                disabled={deleting} 
                className="flex items-center gap-3 px-8 py-4 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all shadow-xl border border-red-500/50"
                title="מחק מהגלריה המשותפת"
              >
                {deleting ? <Loader2 className="animate-spin" size={24} /> : <Trash size={24} />}
                <span className="font-black text-sm md:text-lg">{deleting ? "מוחק..." : "🗑️ למחוק תמונה"}</span>
              </button>
              
              <button 
                onClick={(e) => handleDownloadClick(e, images[selectedImageIndex].url)} 
                className="flex items-center gap-3 px-8 py-4 bg-[#d4af37]/90 hover:bg-[#d4af37] text-white rounded-full transition-all shadow-xl border border-[#d4af37]/50"
                title="שמור לטלפון"
              >
                <Download size={24} />
                <span className="font-black text-sm md:text-lg">📥 לשמור תמונה</span>
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;