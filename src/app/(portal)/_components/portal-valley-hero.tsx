"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Newspaper, Pause, Play } from "lucide-react";

export interface PortalValleyHeroProps {
  locale: string;
  staffCount: number;
}

export function PortalValleyHero({ locale, staffCount }: PortalValleyHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Handle auto-play gracefully if browser allows
    vid.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, []);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden pt-8 pb-16 px-4 sm:px-6 bg-[#0a0a0a] text-white">
      {/* Background Video Layer with Fallback Poster */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/valley/last-frame-bg.png"
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? "opacity-0" : "opacity-100"
          }`}
        />

        <video
          ref={videoRef}
          src="/media/valley/hero-video.mp4"
          poster="/media/valley/last-frame-bg.png"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setIsVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Film Grain Texture Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />

        {/* Vignette Overlay (Dark radial gradient like Valley template) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(10, 10, 10, 0.85) 100%)",
          }}
        />

        {/* Ambient Top Glow from current brand color */}
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[var(--brand)] opacity-20 blur-[130px] rounded-full pointer-events-none"
        />

        {/* Bottom smooth fade to content background */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none"
        />
      </div>

      {/* Floating Center Glassmorphism Card (Valley Hero Card) */}
      <div
        className="relative z-10 w-[94%] md:w-[88%] max-w-4xl mx-auto my-auto p-6 sm:p-10 md:p-14 rounded-[1.8rem] md:rounded-[2.2rem] border border-white/15 backdrop-blur-2xl text-center flex flex-col items-center pointer-events-auto"
        style={{
          background: "rgba(10, 10, 10, 0.52)",
          boxShadow: "0 30px 100px rgba(0, 0, 0, 0.75)",
        }}
      >
        {/* Badge Pill */}
        <div className="mb-6 sm:mb-8">
          <span
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/15 font-sans text-[11px] tracking-[0.3em] uppercase text-white/80 font-medium backdrop-blur-md shadow-xs"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>
              {locale === "en"
                ? "Admissions Open • Academic Year 2026"
                : "เปิดรับสมัครนักศึกษาใหม่ • ประจำปีการศึกษา 2569"}
            </span>
          </span>
        </div>

        {/* Main Headline with Serif & Italic Accents (Valley Typography) */}
        <h1
          className="font-serif font-light leading-[1.12] mb-6 text-white tracking-tight"
          style={{
            fontSize: "clamp(2.2rem, 5.5vw, 4.8rem)",
            letterSpacing: "0.02em",
            textShadow: "0 4px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          {locale === "en" ? (
            <>
              We craft future{" "}
              <span className="italic font-serif text-white/55">leaders</span>
              <br className="hidden md:block" />
              through innovation &amp;{" "}
              <span className="italic font-serif text-white/55">integrity.</span>
            </>
          ) : (
            <>
              บ่มเพาะผู้นำแห่ง{" "}
              <span className="italic font-serif text-white/55">อนาคต</span>
              <br className="hidden md:block" />
              ด้วยนวัตกรรมดิจิทัล และ{" "}
              <span className="italic font-serif text-white/55">คุณธรรม</span>
            </>
          )}
        </h1>

        {/* Description */}
        <p
          className="font-sans font-light leading-relaxed max-w-2xl mx-auto text-white/60 mb-8 sm:mb-10 text-xs sm:text-sm md:text-base tracking-wide"
        >
          {locale === "en"
            ? "Faculty of Management Sciences offers internationally accredited programs designed to cultivate entrepreneurial mindset, advanced digital acumen, and global vision."
            : "คณะวิทยาการจัดการ มุ่งเน้นการเรียนรู้เชิงปฏิบัติการ ผสานเทคโนโลยีดิจิทัล และพัฒนาทักษะการเป็นผู้ประกอบการ เพื่อตอบโจทย์ตลาดแรงงานระดับสากลอย่างยั่งยืน"}
        </p>

        {/* Interactive CTA Buttons (Valley Pill Style) */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/portal/curriculum"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full border border-white/20 font-sans text-xs tracking-[0.2em] uppercase font-semibold text-white bg-white/10 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:gap-5 group shadow-lg backdrop-blur-md"
          >
            <span>{locale === "en" ? "Explore Programs" : "ดูหลักสูตรทั้งหมด"}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/portal/news"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-white/10 font-sans text-xs tracking-[0.15em] uppercase font-medium text-white/75 hover:text-white bg-black/40 hover:bg-black/60 hover:border-white/25 transition-all duration-300 backdrop-blur-md"
          >
            <Newspaper className="h-4 w-4 opacity-70" />
            <span>{locale === "en" ? "Latest News" : "ข่าวสารและประกาศ"}</span>
          </Link>
        </div>

        {/* Stats Grid Bar (Valley 4-Column Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-12 md:mt-16 pt-8 w-full border-t border-white/[0.08]">
          <div className="text-center">
            <span
              className="font-serif font-light block text-2xl sm:text-3xl md:text-4xl text-white tracking-wide"
            >
              12+
            </span>
            <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-white/40 block mt-1">
              {locale === "en" ? "Academic Programs" : "หลักสูตรมาตรฐาน"}
            </span>
          </div>

          <div className="text-center">
            <span
              className="font-serif font-light block text-2xl sm:text-3xl md:text-4xl text-white tracking-wide"
            >
              {staffCount || "35"}+
            </span>
            <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-white/40 block mt-1">
              {locale === "en" ? "Faculty Experts" : "คณาจารย์ผู้เชี่ยวชาญ"}
            </span>
          </div>

          <div className="text-center">
            <span
              className="font-serif font-light block text-2xl sm:text-3xl md:text-4xl text-white tracking-wide"
            >
              98%
            </span>
            <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-white/40 block mt-1">
              {locale === "en" ? "Graduate Employment" : "อัตราการได้งานทำ"}
            </span>
          </div>

          <div className="text-center">
            <span
              className="font-serif font-light block text-2xl sm:text-3xl md:text-4xl text-white tracking-wide"
            >
              2,500+
            </span>
            <span className="font-sans text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-white/40 block mt-1">
              {locale === "en" ? "Active Students" : "นักศึกษาปัจจุบัน"}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Video Background Ambient Toggle Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="absolute bottom-5 right-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-black/50 hover:bg-black/80 text-white/50 hover:text-white/90 text-[10px] tracking-wider uppercase backdrop-blur-md transition-all cursor-pointer shadow-md"
        aria-label={isPlaying ? "Pause background video" : "Play background video"}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        <span className="hidden sm:inline">
          {isPlaying
            ? locale === "en"
              ? "Pause Ambient"
              : "หยุดวิดีโอ"
            : locale === "en"
            ? "Play Ambient"
            : "เล่นวิดีโอ"}
        </span>
      </button>
    </section>
  );
}
