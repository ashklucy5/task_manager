// src/components/ui/SplashScreen.tsx

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500); // Wait for fade out animation
    }, 2500); // Show for 2.5 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className={`splash-screen ${isVisible ? '' : 'hidden'}`}>
      {/* Logo */}
      <div className="splash-logo">
        N
      </div>

      {/* Title */}
      <h1 className="splash-title">NexusFlow AI</h1>
      <p className="splash-subtitle">Business Command Center</p>

      {/* Loader */}
      <div className="splash-loader" />
    </div>
  );
};

export default SplashScreen;