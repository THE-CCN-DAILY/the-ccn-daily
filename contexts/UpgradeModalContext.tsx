import React, { createContext, useContext, useState, ReactNode } from 'react';
import UpgradeModal from '../components/UpgradeModal';

interface UpgradeModalContextType {
    openUpgradeModal: (featureName: string, requiredTier?: 'free' | 'pro' | 'max') => void;
    closeUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType | undefined>(undefined);

export const UpgradeModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [featureName, setFeatureName] = useState('');
    const [requiredTier, setRequiredTier] = useState<'free' | 'pro' | 'max'>('pro');

    const openUpgradeModal = (name: string, tier: 'free' | 'pro' | 'max' = 'pro') => {
        setFeatureName(name);
        setRequiredTier(tier);
        setIsOpen(true);
    };

    const closeUpgradeModal = () => {
        setIsOpen(false);
    };

    return (
        <UpgradeModalContext.Provider value={{ openUpgradeModal, closeUpgradeModal }}>
            {children}
            <UpgradeModal 
                isOpen={isOpen} 
                onClose={closeUpgradeModal} 
                featureName={featureName} 
                requiredTier={requiredTier} 
            />
        </UpgradeModalContext.Provider>
    );
};

export const useUpgradeModal = () => {
    const context = useContext(UpgradeModalContext);
    if (context === undefined) {
        throw new Error('useUpgradeModal must be used within an UpgradeModalProvider');
    }
    return context;
};
