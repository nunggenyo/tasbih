import { useState, useEffect, useRef, useCallback } from 'react';
import './DynamicWallpaper.css';

export default function DynamicWallpaper({ isVisible }) {
  const [bg1, setBg1] = useState('');
  const [bg2, setBg2] = useState('');
  const [activeLayer, setActiveLayer] = useState(1);
  const [author, setAuthor] = useState(null);

  const activeLayerRef = useRef(1);
  const currentIndexRef = useRef(0);
  const imagesRef = useRef([]);
  const isFetchingRef = useRef(false);
  const hasFetchedOnce = useRef(false);

  const trackDownload = async (downloadUrl) => {
    if (!downloadUrl) return;
    try {
      await fetch('/api/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl })
      });
    } catch (e) {
      console.error("Gagal merekod muat turun Unsplash", e);
    }
  };

  const fetchImages = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    hasFetchedOnce.current = true;
    
    try {
      const response = await fetch('/api/wallpaper');

      if (response.status === 403) {
        console.warn("Unsplash API limit (50/jam) telah habis. Menggunakan gambar fallback.");
        throw new Error('Rate limit exceeded');
      }
      if (!response.ok) throw new Error('Network error');

      const data = await response.json();

      if (Array.isArray(data)) {
        const parsedImages = data.map(item => ({
          url: item.urls.regular,
          photographerName: item.user.name,
          photographerUsername: item.user.username,
          downloadLocation: item.links.download_location
        }));
        
        // Jika ini adalah muat turun pertama kali
        if (imagesRef.current.length === 0 && parsedImages.length > 0) {
          const firstImg = parsedImages[0];
          setBg1(firstImg.url);
          setAuthor({ name: firstImg.photographerName, username: firstImg.photographerUsername });
          setActiveLayer(1);
          activeLayerRef.current = 1;
          currentIndexRef.current = 0;
          trackDownload(firstImg.downloadLocation);
        }
        
        // Kemas kini senarai gambar (jika kitaran baru, ia ganti senarai lama)
        imagesRef.current = parsedImages;
      }
    } catch (error) {
      console.error("Gagal memuat turun gambar dari Unsplash:", error);
      if (imagesRef.current.length === 0) {
        const fallbacks = [
          { url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=1080&auto=format&fit=crop', photographerName: 'Ishan @seefromthesky', photographerUsername: 'seefromthesky' },
          { url: 'https://images.unsplash.com/photo-1551041777-ed277b8dd348?q=80&w=1080&auto=format&fit=crop', photographerName: 'Fuu J', photographerUsername: 'fuuj' },
          { url: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?q=80&w=1080&auto=format&fit=crop', photographerName: 'Adolfo Félix', photographerUsername: 'adolfofelix' },
          { url: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1080&auto=format&fit=crop', photographerName: 'Kellen Righorn', photographerUsername: 'kellenrighorn' },
          { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080&auto=format&fit=crop', photographerName: 'Eberhard Grossgasteiger', photographerUsername: 'eberhardgross' }
        ];
        imagesRef.current = fallbacks;
        setBg1(fallbacks[0].url);
        setAuthor({ name: fallbacks[0].photographerName, username: fallbacks[0].photographerUsername });
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Muat turun gambar apabila visible buat kali pertama
  useEffect(() => {
    if (isVisible && !hasFetchedOnce.current) {
      fetchImages();
    }
  }, [isVisible, fetchImages]);

  // Logik Crossfade setiap 15 saat
  useEffect(() => {
    if (!isVisible) return; // Hentikan interval jika tidak visible
    
    const interval = setInterval(() => {
      const currentImages = imagesRef.current;
      if (currentImages.length < 2) return;

      let nextIndex = currentIndexRef.current + 1;
      
      // Jika dah sampai gambar terakhir, kita fetch 30 gambar BARU dan set index ke 0
      if (nextIndex >= currentImages.length) {
        fetchImages(); // Fetch secara latar belakang
        nextIndex = 0;
      }

      // PINDAHKAN KEMAS KINI KE SINI
      // Supaya index sentiasa bergerak ke hadapan walaupun gambar gagal/lambat di-load
      currentIndexRef.current = nextIndex;

      const nextImg = currentImages[nextIndex];

      // PRELOAD GAMBAR: Elak skrin putih masa bertukar
      const img = new Image();
      img.src = nextImg.url;
      img.onload = () => {
        if (activeLayerRef.current === 1) {
          setBg2(nextImg.url);
          setActiveLayer(2);
          activeLayerRef.current = 2;
        } else {
          setBg1(nextImg.url);
          setActiveLayer(1);
          activeLayerRef.current = 1;
        }
        setAuthor({ name: nextImg.photographerName, username: nextImg.photographerUsername });
        // currentIndexRef.current = nextIndex; // TELAH DIPINDAH KE ATAS
        if (nextImg.downloadLocation) {
          trackDownload(nextImg.downloadLocation);
        }
      };

      // Handle ralat supaya tidak senyap jika gambar gagal dimuat turun
      img.onerror = () => {
        console.warn("Gambar gagal dimuat turun, aplikasi akan teruskan ke index seterusnya.");
      };
    }, 15000); // 15 saat

    return () => clearInterval(interval);
  }, [isVisible, fetchImages]);

  const utmParams = "?utm_source=tasbih_digital&utm_medium=referral";

  return (
    <div className={`wallpaper-container ${isVisible ? 'wallpaper-container--visible' : ''}`}>
      <div
        className={`wallpaper-layer ${activeLayer === 1 ? 'active' : ''}`}
        style={{ backgroundImage: `url("${bg1}")` }}
      />
      <div
        className={`wallpaper-layer ${activeLayer === 2 ? 'active' : ''}`}
        style={{ backgroundImage: `url("${bg2}")` }}
      />
      <div className="wallpaper-overlay" />
      
      {author && (
        <div className="unsplash-attribution">
          Photo by <a href={`https://unsplash.com/@${author.username}${utmParams}`} target="_blank" rel="noopener noreferrer">{author.name}</a> on <a href={`https://unsplash.com/${utmParams}`} target="_blank" rel="noopener noreferrer">Unsplash</a>
        </div>
      )}
    </div>
  );
}