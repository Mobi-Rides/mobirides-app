import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Car, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthPromptProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    title: string;
    description: string;
    feature: string;
    benefits: string[];
    primaryAction: 'signin' | 'signup';
  } | null;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({ isOpen, onClose, config }) => {
  const navigate = useNavigate();

  if (!config) return null;

  const handlePrimaryAction = () => {
    onClose();
    navigate(config.primaryAction === 'signin' ? '/login' : '/signup');
  };

  const handleSecondaryAction = () => {
    onClose();
    navigate(config.primaryAction === 'signin' ? '/signup' : '/login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {config.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Car className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 mb-4">{config.description}</p>
          </div>

          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3">With MobiRides you can:</h4>
              <ul className="space-y-2">
                {config.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button 
              onClick={handlePrimaryAction}
              className="w-full"
              size="lg"
            >
              {config.primaryAction === 'signin' ? 'Sign In' : 'Sign Up'} to {config.feature}
            </Button>
            
            <Button 
              onClick={handleSecondaryAction}
              variant="outline"
              className="w-full"
            >
              {config.primaryAction === 'signin' ? 'Create Account' : 'Already have an account?'}
            </Button>
          </div>

          <Button 
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-500"
          >
            Continue browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPrompt;