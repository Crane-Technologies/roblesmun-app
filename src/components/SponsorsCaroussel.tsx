import { useEffect, type FC } from "react";
import type { Sponsor } from "../interfaces/Sponsor";

interface SponsorsCarousselProps {
  sponsors: Sponsor[];
  currentSlide: number;
  setCurrentSlide: (idx: number) => void;
  autoSlideInterval?: number;
}

const SponsorsCaroussel: FC<SponsorsCarousselProps> = ({
  sponsors,
  currentSlide,
  setCurrentSlide,
  autoSlideInterval = 5000,
}) => {
  useEffect(() => {
    if (sponsors.length === 0) return;

    const timer = setTimeout(() => {
      setCurrentSlide((currentSlide + 1) % sponsors.length);
    }, autoSlideInterval);
    return () => clearTimeout(timer);
  }, [currentSlide, sponsors.length, setCurrentSlide, autoSlideInterval]);

  if (!sponsors || sponsors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="flex items-center justify-center h-48 w-full">
          <p className="text-gray-400">No hay patrocinadores disponibles</p>
        </div>
      </div>
    );
  }

  const validCurrentSlide = currentSlide >= sponsors.length ? 0 : currentSlide;
  const currentSponsor = sponsors[validCurrentSlide];

  if (!currentSponsor) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="flex items-center justify-center h-48 w-full">
          <p className="text-gray-400">Cargando patrocinador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex items-center justify-center h-48 w-full transition-all duration-700 ease-in-out">
        <img
          src={currentSponsor.logo}
          alt={`Logo de ${currentSponsor.name}`}
          className="max-h-48 max-w-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=";
          }}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-full px-2">
        {sponsors.map((_, idx) => (
          <button
            aria-label={`Go to slide ${idx + 1}`}
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
              idx === validCurrentSlide
                ? "bg-[#d53137] scale-125"
                : "bg-[#242424]"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SponsorsCaroussel;
