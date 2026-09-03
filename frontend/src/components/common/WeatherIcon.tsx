import React from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudDrizzle, 
  CloudSnow, 
  CloudFog, 
  Wind,
  Droplets,
  HelpCircle
} from 'lucide-react';

interface WeatherIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ name, className = "w-6 h-6", size }) => {
  const iconMap: Record<string, React.ReactElement> = {
    Sun: <Sun className={`${className} text-amber-500`} size={size} />,
    SunDim: <Sun className={`${className} text-amber-400`} size={size} />,
    CloudSun: <CloudSun className={`${className} text-amber-400`} size={size} />,
    Cloud: <Cloud className={`${className} text-slate-400`} size={size} />,
    CloudFog: <CloudFog className={`${className} text-slate-400`} size={size} />,
    CloudDrizzle: <CloudDrizzle className={`${className} text-sky-500`} size={size} />,
    CloudRain: <CloudRain className={`${className} text-blue-500`} size={size} />,
    CloudLightning: <CloudLightning className={`${className} text-yellow-500`} size={size} />,
    CloudSnow: <CloudSnow className={`${className} text-sky-400`} size={size} />,
    Wind: <Wind className={`${className} text-teal-500`} size={size} />,
    Droplets: <Droplets className={`${className} text-blue-500`} size={size} />
  };

  return iconMap[name] || <CloudSun className={`${className} text-slate-400`} size={size} />;
};
