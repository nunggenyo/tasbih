import { useState, useEffect, useRef } from 'react';
import './DynamicWallpaper.css';

export default function DynamicWallpaper() {
  const [images, setImages] = useState([]);
  const [bg1, setBg1] = useState('');
  const [bg2, setBg2] = useState('');
  const [activeLayer, setActiveLayer] = useState(1);

  // Guna useRef supaya state sentiasa up-to-date dalam setInterval
  const activeLayerRef = useRef(1);
  const currentIndexRef = useRef(0);

  // LANGKAH 1: Ambil senarai gambar dari Unsplash bila komponen mula-mula di-load
  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Query diset kepada: alam semula jadi (nature, landscape) dan islamik (islamic, mosque)
        // count=30 akan memuat turun 30 URL sekaligus untuk jimat kuota API
        const response = await fetch(
          `https://api.unsplash.com/photos/random?query=nature,islamic,mosque,landscape&orientation=portrait&count=30`,
          {
            headers: {
              // Gantikan ini dengan Access Key Unsplash anda
              Authorization: 'Client-ID AwywSTo1tCTxs0Px8o4oeBjmF3HI7KU_DDZ6FPNWKWQ'
            }
          }
        );

        if (!response.ok) throw new Error('API limit reached atau network error');

        const data = await response.json();

        if (Array.isArray(data)) {
          // Kita guna resolusi 'regular' (biasanya 1080w).
          // Cukup lawa untuk mobile dan tak makan data user teruk sangat.
          const urls = data.map(item => item.urls.regular);
          setImages(urls);

          // Paparkan gambar pertama ke layer 1 dengan segera
          setBg1(urls[0]);
        }
      } catch (error) {
        console.error("Gagal memuat turun gambar dari Unsplash:", error);
        // Fallback: Jika API error (sebab limit dll), kita guna placeholder
        setBg1('https://picsum.photos/1080/1920?random=1');
      }
    };

    fetchImages();
  }, []);

  // LANGKAH 2: Logik Crossfade setiap 15 saat
  useEffect(() => {
    // Jangan mulakan interval selagi array gambar tak siap
    if (images.length < 2) return;

    const interval = setInterval(() => {
      // Dapatkan index gambar seterusnya
      let nextIndex = currentIndexRef.current + 1;
      // Jika dah sampai gambar terakhir, patah balik ke gambar pertama (loop)
      if (nextIndex >= images.length) {
        nextIndex = 0;
      }

      const nextUrl = images[nextIndex];

      // PRELOAD GAMBAR: Elak skrin putih masa bertukar
      const img = new Image();
      img.src = nextUrl;
      img.onload = () => {
        if (activeLayerRef.current === 1) {
          setBg2(nextUrl);
          setActiveLayer(2);
          activeLayerRef.current = 2;
        } else {
          setBg1(nextUrl);
          setActiveLayer(1);
          activeLayerRef.current = 1;
        }
        currentIndexRef.current = nextIndex; // Kemas kini index semasa
      };
    }, 15000); // 15,000 milisaat = 15 saat

    // Bersihkan interval jika komponen ditutup
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="wallpaper-container">
      <div
        className={`wallpaper-layer ${activeLayer === 1 ? 'active' : ''}`}
        style={{ backgroundImage: `url(${bg1})` }}
      />
      <div
        className={`wallpaper-layer ${activeLayer === 2 ? 'active' : ''}`}
        style={{ backgroundImage: `url(${bg2})` }}
      />
      {/* Overlay Gelap */}
      <div className="wallpaper-overlay" />
    </div>
  );
}