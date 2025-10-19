import { useState, useEffect } from "react";

export function EarthBackground() {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;

      const fadeProgress = Math.min(scrollPosition / (windowHeight * 2), 1);
      setOpacity(1 - fadeProgress);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
      style={{ opacity }}
    >
      <div className="relative w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px]">
        <img
          src="/earthTransparent.png"
          alt="Earth globe"
          className="w-full h-full object-contain opacity-60"
        />
      </div>
    </div>
  );
}
