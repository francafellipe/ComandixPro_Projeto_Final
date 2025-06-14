import { Coffee, Utensils } from "lucide-react";

interface ComandixLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function ComandixLogo({ size = "md", showText = true }: ComandixLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl"
  };

  return (
    <div className="flex items-center gap-2">
      {/* Logo Icon */}
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-md flex items-center justify-center">
          <div className="flex items-center">
            <Coffee className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6'} text-white mr-0.5`} />
            <Utensils className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6'} text-white`} />
          </div>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-gray-900 ${textSizeClasses[size]} leading-tight`}>
            Comandix<span className="text-blue-600">Pro</span>
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 leading-tight">
              Sistema de Gestão
            </span>
          )}
        </div>
      )}
    </div>
  );
}