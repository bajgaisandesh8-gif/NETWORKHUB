import React from 'react';
import { 
  Monitor, 
  Laptop as LaptopIcon, 
  Server as ServerIcon, 
  Router as RouterIcon, 
  Network as SwitchIcon, 
  Wifi, 
  Shield, 
  Printer as PrinterIcon, 
  Globe, 
  Cloud 
} from 'lucide-react';

interface DeviceIconProps {
  type: string;
  className?: string;
  size?: number;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({ type, className = 'w-5 h-5', size = 20 }) => {
  switch (type.toLowerCase()) {
    case 'pc':
      return <Monitor size={size} className={className} />;
    case 'laptop':
      return <LaptopIcon size={size} className={className} />;
    case 'server':
      return <ServerIcon size={size} className={className} />;
    case 'router':
      return <RouterIcon size={size} className={className} />;
    case 'switch':
      return <SwitchIcon size={size} className={className} />;
    case 'access_point':
    case 'ap':
      return <Wifi size={size} className={className} />;
    case 'firewall':
      return <Shield size={size} className={className} />;
    case 'printer':
      return <PrinterIcon size={size} className={className} />;
    case 'internet':
      return <Globe size={size} className={className} />;
    case 'cloud':
    default:
      return <Cloud size={size} className={className} />;
  }
};
