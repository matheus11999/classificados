import React, { useState } from 'react';
import { Button } from './ui/button';
import { Zap } from 'lucide-react';
import { BoostAdModal } from './BoostAdModal';

interface Ad {
  id: string;
  title: string;
  price: string;
}

interface BoostButtonProps {
  ad: Ad;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function BoostButton({ ad, variant = 'outline', size = 'sm', className = '' }: BoostButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`${className}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
      >
        <Zap className="h-4 w-4 mr-1" />
        Impulsionar
      </Button>
      
      <BoostAdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ad={ad}
      />
    </>
  );
}