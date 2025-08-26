import React, { useState } from 'react';
import { Button } from './ui/button';
import { Zap } from 'lucide-react';
import { BoostAdModal } from './BoostAdModal';
import { userAuth } from '@/lib/user-auth';

interface Ad {
  id: string;
  title: string;
  price: string;
  userId?: string;
}

interface BoostButtonProps {
  ad: Ad;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function BoostButton({ ad, variant = 'outline', size = 'sm', className = '' }: BoostButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = userAuth.getUser();
  
  // Only show boost button if user owns this ad
  if (!currentUser || !ad.userId || ad.userId !== currentUser.id) {
    return null;
  }

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