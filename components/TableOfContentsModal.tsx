import React from 'react';

interface ContentsModalProps {
    onClose: () => void;
}

const ContentsModal: React.FC<ContentsModalProps> = ({ onClose }) => {
    return (
        <div 
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm z-30 flex justify-center items-center"
            onClick={onClose}
        >
            <div 
                className="bg-brand-secondary border border-brand-border rounded-xl shadow-2xl w-full max-w-sm m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                    <h3 className="text-lg font-bold text-brand-text-primary">Contents</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-secondary text-2xl leading-none">&times;</button>
                </div>
                <div className="p-4">
                    <div className="mb-6">
                        <h4 className="font-bold text-brand-text-primary mb-3">Chapters</h4>
                        <ul className="space-y-2 text-brand-text-secondary">
                            <li className="flex justify-between items-center p-2 rounded-lg bg-brand-accent/20 text-brand-accent">
                                <span>1. Introduction to Faith</span>
                                <span>pg 1</span>
                            </li>
                            <li className="flex justify-between items-center p-2 rounded-lg hover:bg-brand-secondary">
                                <span>2. Walking in Truth</span>
                                <span>pg 3</span>
                            </li>
                            <li className="flex justify-between items-center p-2 rounded-lg hover:bg-brand-secondary">
                                <span>3. Community and Fellowship</span>
                                <span>pg 5</span>
                            </li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-brand-text-primary mb-3">Reading Stats</h4>
                        <div className="text-sm space-y-2 text-brand-text-secondary">
                            <div className="flex justify-between">
                                <span>Chapters completed</span>
                                <span className="font-semibold text-brand-text-primary">1 of 3</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Highlights</span>
                                <span className="font-semibold text-brand-text-primary">0</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bookmarks</span>
                                <span className="font-semibold text-brand-text-primary">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentsModal;