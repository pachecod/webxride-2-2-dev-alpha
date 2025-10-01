import React, { useState, useEffect } from 'react';

interface WebXRideAIAssistantProps {
  isThinking?: boolean;
  isHappy?: boolean;
  isConfused?: boolean;
  size?: number;
  className?: string;
}

const WebXRideAIAssistant: React.FC<WebXRideAIAssistantProps> = ({
  isThinking = false,
  isHappy = false,
  isConfused = false,
  size = 60,
  className = ""
}) => {
  const [eyeBlink, setEyeBlink] = useState(false);
  const [bounce, setBounce] = useState(false);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Bounce animation when thinking
  useEffect(() => {
    if (isThinking) {
      const bounceInterval = setInterval(() => {
        setBounce(true);
        setTimeout(() => setBounce(false), 600);
      }, 1200);
      return () => clearInterval(bounceInterval);
    }
  }, [isThinking]);

  const getEyeExpression = () => {
    if (isConfused) return "confused";
    if (isHappy) return "happy";
    if (isThinking) return "thinking";
    return "normal";
  };

  const getMouthExpression = () => {
    if (isHappy) return "smile";
    if (isConfused) return "confused";
    if (isThinking) return "thinking";
    return "neutral";
  };

  return (
    <div 
      className={`inline-block ${className} ${bounce ? 'animate-bounce' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="drop-shadow-lg"
      >
        <defs>
          {/* Car body gradient - deep purple with highlights */}
          <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="30%" stopColor="#7C3AED" />
            <stop offset="70%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          
          {/* Car highlight gradient */}
          <linearGradient id="carHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>
          
          {/* Eye gradient */}
          <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          
          {/* VR Headset gradient */}
          <linearGradient id="vrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          
          {/* Wheel gradient */}
          <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
        </defs>

        {/* Car shadow */}
        <ellipse cx="50" cy="88" rx="28" ry="6" fill="#000000" opacity="0.2" />
        
        {/* Main car body - rounded and friendly */}
        <ellipse
          cx="50"
          cy="60"
          rx="28"
          ry="18"
          fill="url(#carGradient)"
          stroke="#4C1D95"
          strokeWidth="1"
        />

        {/* Car front - more rounded */}
        <ellipse
          cx="25"
          cy="60"
          rx="12"
          ry="18"
          fill="url(#carGradient)"
          stroke="#4C1D95"
          strokeWidth="1"
        />

        {/* Car back */}
        <ellipse
          cx="75"
          cy="60"
          rx="12"
          ry="18"
          fill="url(#carGradient)"
          stroke="#4C1D95"
          strokeWidth="1"
        />

        {/* Car highlight */}
        <ellipse
          cx="50"
          cy="50"
          rx="20"
          ry="12"
          fill="url(#carHighlight)"
          stroke="none"
        />

        {/* Wheels */}
        <circle cx="30" cy="75" r="8" fill="url(#wheelGradient)" stroke="#1F2937" strokeWidth="1" />
        <circle cx="70" cy="75" r="8" fill="url(#wheelGradient)" stroke="#1F2937" strokeWidth="1" />
        <circle cx="30" cy="75" r="5" fill="#4B5563" />
        <circle cx="70" cy="75" r="5" fill="#4B5563" />
        <circle cx="30" cy="75" r="2" fill="#6B7280" />
        <circle cx="70" cy="75" r="2" fill="#6B7280" />

        {/* Eyes - positioned on the car front */}
        <g transform="translate(35, 45)">
          {/* Left eye */}
          <ellipse
            cx="8"
            cy="8"
            rx="6"
            ry="8"
            fill="url(#eyeGradient)"
            stroke="#D1D5DB"
            strokeWidth="1.5"
          />
          
          {/* Right eye */}
          <ellipse
            cx="22"
            cy="8"
            rx="6"
            ry="8"
            fill="url(#eyeGradient)"
            stroke="#D1D5DB"
            strokeWidth="1.5"
          />

          {/* Eye pupils */}
          <circle
            cx={8 + (isConfused ? 1 : 0)}
            cy={8 + (isConfused ? 1 : 0)}
            r="3"
            fill="#1F2937"
            className={eyeBlink ? 'opacity-0' : 'opacity-100'}
          />
          <circle
            cx={22 + (isConfused ? 1 : 0)}
            cy={8 + (isConfused ? 1 : 0)}
            r="3"
            fill="#1F2937"
            className={eyeBlink ? 'opacity-0' : 'opacity-100'}
          />

          {/* Eye highlights */}
          <circle cx="9" cy="6" r="1.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="23" cy="6" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </g>

        {/* Eyebrows - friendly and curved */}
        <g transform="translate(35, 38)">
          <path
            d="M 2 2 Q 8 -1 14 2"
            stroke="#1F2937"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className={isConfused ? 'transform rotate-12' : ''}
          />
          <path
            d="M 16 2 Q 22 -1 28 2"
            stroke="#1F2937"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className={isConfused ? 'transform -rotate-12' : ''}
          />
        </g>

        {/* Mouth - wide friendly smile */}
        <g transform="translate(35, 58)">
          {getMouthExpression() === 'smile' && (
            <path
              d="M 5 0 Q 15 8 25 0"
              stroke="#1F2937"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {getMouthExpression() === 'confused' && (
            <path
              d="M 8 0 Q 15 -2 22 0"
              stroke="#1F2937"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {getMouthExpression() === 'thinking' && (
            <ellipse
              cx="15"
              cy="2"
              rx="4"
              ry="2"
              fill="#1F2937"
            />
          )}
          {getMouthExpression() === 'neutral' && (
            <path
              d="M 8 0 Q 15 3 22 0"
              stroke="#1F2937"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Bumper */}
        <ellipse
          cx="50"
          cy="70"
          rx="20"
          ry="3"
          fill="#9CA3AF"
          stroke="#6B7280"
          strokeWidth="0.5"
        />

        {/* VR Headset - prominent on top */}
        <g transform="translate(35, 15)">
          {/* VR headset main body */}
          <ellipse
            cx="15"
            cy="15"
            rx="20"
            ry="12"
            fill="url(#vrGradient)"
            stroke="#111827"
            strokeWidth="1.5"
          />
          
          {/* VR headset strap */}
          <path
            d="M 5 15 Q 15 5 25 15 Q 15 25 5 15"
            fill="none"
            stroke="#111827"
            strokeWidth="2"
          />
          
          {/* VR lenses */}
          <ellipse cx="10" cy="15" rx="7" ry="5" fill="#000000" />
          <ellipse cx="20" cy="15" rx="7" ry="5" fill="#000000" />
          
          {/* Lens reflections */}
          <ellipse cx="10" cy="13" rx="2" ry="1.5" fill="#FFFFFF" opacity="0.6" />
          <ellipse cx="20" cy="13" rx="2" ry="1.5" fill="#FFFFFF" opacity="0.6" />
        </g>

        {/* Thinking animation dots */}
        {isThinking && (
          <g transform="translate(50, 8)">
            <circle cx="0" cy="0" r="1.5" fill="#8B5CF6" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="6" cy="0" r="1.5" fill="#8B5CF6" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="12" cy="0" r="1.5" fill="#8B5CF6" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" begin="0.6s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Happy sparkles */}
        {isHappy && (
          <g>
            <circle cx="15" cy="20" r="1" fill="#FCD34D" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="85" cy="25" r="1" fill="#FCD34D" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" begin="0.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="35" r="1" fill="#FCD34D" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" begin="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="90" cy="40" r="1" fill="#FCD34D" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" begin="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>
    </div>
  );
};

export default WebXRideAIAssistant;
