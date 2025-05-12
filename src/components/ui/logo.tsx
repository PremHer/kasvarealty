import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <Link href="/" className={cn("flex items-center space-x-2", className)}>
      <div className={cn("bg-primary rounded-lg flex items-center justify-center", sizeClasses[size])}>
        <span className="text-white font-bold text-xl">K</span>
      </div>
      <span className={cn(
        "font-semibold text-gray-900",
        size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
      )}>
        Kasva Realty
      </span>
    </Link>
  );
} 