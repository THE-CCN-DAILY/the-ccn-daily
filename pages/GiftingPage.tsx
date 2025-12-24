import React, { useState } from 'react';
import Card from '../components/Card';
import { GiftIcon, ReaderIcon, SpeakerWaveIcon, SendIcon, CheckIcon, CloseIcon, SpinnerIcon } from '../components/icons';
import { sendGiftEmail } from '../services/emailService';

interface GiftableItem {
    id: string;
    type: 'book' | 'podcast-series';
    title: string;
    description: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    price: number;
}

const mockGiftableItems: GiftableItem[] = [
    {
        id: 'book1',
        type: 'book',
        title: 'Foundations of Faith',
        description: 'A comprehensive guide to the core tenets of Christian belief. Perfect for new believers.',
        icon: ReaderIcon,
        price: 14.99,
    },
    {
        id: 'podcast2',
        type: 'podcast-series',
        title: 'The Art of Prayer: Season 1',
        description: 'An 8-part audio series that deepens your understanding and practice of prayer.',
        icon: SpeakerWaveIcon,
        price: 9.99,
    }
];

const GiftModal: React.FC<{
    item: GiftableItem;
    onClose: () => void;
    onSend: (email: string, message: string) => Promise<void>;
}> = ({ item, onClose, onSend }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSend = async () => {
        setIsSending(true);
        await onSend(email, message);
        setIsSending(false);
        setIsSent(true);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div 
                className="bg-brand-secondary rounded-xl shadow-lg w-full max-w-md p-6 m-4 animate-fade-in-up"
                onClick={e => e.stopPropagation()}
                style={{ animationDuration: '0.3s' }}
            >
                {isSent ? (
                    <div className="text-center p-8">
                        <CheckIcon className="w-16 h-16 text-status-success mx-auto mb-4"/>
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Gift Sent!</h2>
                        <p className="text-brand-text-secondary">Your gift of "{item.title}" has been sent to {email}. They will receive an email with instructions shortly.</p>
                        <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg bg-brand-accent hover:bg-opacity-90 text-white font-semibold">
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-text-primary mb-1">Send "{item.title}" as a Gift</h2>
                                <p className="text-brand-text-secondary">You are gifting: {item.description}</p>
                            </div>
                            <button onClick={onClose} className="p-1 -mr-2 -mt-2 text-brand-text-secondary hover:text-brand-text-primary">
                                <CloseIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Recipient's Email Address"
                                className="w-full bg-brand-dark border border-brand-border rounded-lg py-2 px-3 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                            />
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                placeholder="Add a personal message (optional)"
                                className="w-full bg-brand-dark border border-brand-border rounded-lg p-3 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
                            />
                        </div>
                        <div className="flex justify-end items-center gap-4 mt-6">
                            <span className="text-xl font-bold text-brand-text-primary">${item.price}</span>
                            <button 
                                onClick={handleSend}
                                disabled={!email.trim() || !email.includes('@') || isSending}
                                className="px-6 py-2 rounded-lg bg-brand-accent hover:bg-opacity-90 text-white font-semibold shadow-md disabled:bg-opacity-50 flex items-center justify-center gap-2 w-36"
                            >
                                {isSending ? <SpinnerIcon className="w-5 h-5"/> : <><SendIcon className="w-5 h-5"/> Send Gift</>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const GiftingPage: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<GiftableItem | null>(null);

    const handleSendGift = async (email: string, message: string) => {
        if (!selectedItem) return;
        // This function now calls our mock email service, which simulates a real API call.
        await sendGiftEmail({
            recipientEmail: email,
            personalMessage: message,
            giftedItemTitle: selectedItem.title,
        });
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Gifting & Generosity</h1>
            <p className="text-lg text-brand-text-secondary mb-8">
                Share the gift of faith and wisdom. Purchase a course or book for a friend to bless their journey.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockGiftableItems.map(item => (
                    <Card key={item.id} className="flex flex-col">
                        <div className="flex-shrink-0 w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-brand-secondary border-4 border-brand-dark shadow-inner mb-4">
                            <item.icon className="w-10 h-10 text-brand-accent" />
                        </div>
                        <div className="flex-grow text-center">
                            <h3 className="text-xl font-bold text-brand-text-primary">{item.title}</h3>
                            <p className="text-sm text-brand-text-secondary mt-1">{item.description}</p>
                        </div>
                        <div className="mt-6 text-center">
                            <button 
                                onClick={() => setSelectedItem(item)}
                                className="w-full px-4 py-2 rounded-lg bg-brand-accent text-white font-semibold flex items-center justify-center gap-2"
                            >
                                <GiftIcon className="w-5 h-5"/>
                                Gift for ${item.price}
                            </button>
                        </div>
                    </Card>
                ))}
                <Card className="flex flex-col text-center border-dashed border-brand-border/70 items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-brand-secondary flex items-center justify-center mb-4">
                        <span className="text-4xl text-brand-text-secondary/50">?</span>
                    </div>
                     <h3 className="text-xl font-bold text-brand-text-primary">More Coming Soon</h3>
                    <p className="text-sm text-brand-text-secondary mt-1">Our library of giftable content is always growing. Check back for new books, courses, and more.</p>
                </Card>
            </div>

            {selectedItem && (
                <GiftModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onSend={handleSendGift}
                />
            )}
        </div>
    );
};

export default GiftingPage;