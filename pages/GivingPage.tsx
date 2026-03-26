import React, { useState } from 'react';
import Card from '../components/Card';
import { CreditCardIcon, DbIcon, CheckIcon } from '../components/icons';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

const FLUTTERWAVE_PUBLIC_KEY = (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X';

import { useNotifications } from '../contexts/NotificationContext';

const GivingPage: React.FC = () => {
  const { notify } = useNotifications();
  const [amount, setAmount] = useState<number>(50);
  const [type, setType] = useState<'one-time' | 'monthly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Flutterwave configuration
  const config = {
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: Date.now().toString(),
    amount: amount,
    currency: 'USD',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: auth.currentUser?.email || 'donor@example.com',
      phone_number: '',
      name: auth.currentUser?.displayName || 'Generous Donor',
    },
    customizations: {
      title: 'Project Phoenix Support',
      description: `Payment for ${type} partnership`,
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handlePayment = () => {
    setIsProcessing(true);
    
    handleFlutterPayment({
      callback: async (response) => {
         console.log(response);
         closePaymentModal();
         if (response.status === 'successful') {
             await recordDonation();
         } else {
             setIsProcessing(false);
             notify("Payment was not successful. Please try again.", "error");
         }
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });
  };

  const recordDonation = async () => {
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'donations'), {
        amount,
        type,
        method: 'flutterwave',
        userUid: user?.uid || null,
        userEmail: user?.email || null,
        status: 'completed',
        createdAt: serverTimestamp()
      });
      
      setIsProcessing(false);
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'donations');
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pb-20 text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckIcon className="w-12 h-12 text-green-400" />
        </div>
        <h1 className="text-4xl font-black text-brand-text-primary mb-4">Thank You!</h1>
        <p className="text-brand-text-secondary text-lg mb-8">Your {type === 'monthly' ? 'monthly partnership' : 'gift'} of ${amount} has been processed successfully.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="px-8 py-4 bg-brand-secondary text-brand-text-primary rounded-xl font-bold hover:bg-brand-border transition-colors"
        >
          Return to Giving
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-text-primary flex items-center gap-4">
          <CreditCardIcon className="w-10 h-10 text-brand-accent"/>
          Giving & Support
        </h1>
        <p className="text-brand-text-secondary mt-2">Partner with us to expand Project Phoenix globally.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="space-y-6">
          <h2 className="text-xl font-bold text-brand-text-primary mb-4">Select Amount</h2>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setType('one-time')}
              className={`flex-1 py-3 rounded-xl font-bold border transition-all ${type === 'one-time' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-secondary text-brand-text-secondary border-brand-border'}`}
            >
              One-Time Gift
            </button>
            <button 
              onClick={() => setType('monthly')}
              className={`flex-1 py-3 rounded-xl font-bold border transition-all ${type === 'monthly' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-secondary text-brand-text-secondary border-brand-border'}`}
            >
              Monthly Partner
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[25, 50, 100, 250, 500, 1000].map(val => (
              <button 
                key={val}
                onClick={() => setAmount(val)}
                className={`py-4 rounded-xl font-bold border transition-all ${amount === val ? 'bg-brand-accent/20 text-brand-accent border-brand-accent' : 'bg-brand-dark text-brand-text-primary border-brand-border hover:border-brand-accent/50'}`}
              >
                ${val}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Custom Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-secondary font-bold">$</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-brand-dark border border-brand-border rounded-xl py-4 pl-8 pr-4 text-brand-text-primary font-bold focus:border-brand-accent outline-none"
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
          <h2 className="text-xl font-bold text-brand-text-primary mb-4">Payment Method</h2>
          
          <div className="space-y-4">
            <div className="w-full flex items-center justify-between p-4 rounded-xl border bg-[#FB9129]/10 border-[#FB9129]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FB9129]/20 rounded-lg flex items-center justify-center">
                  <DbIcon className="w-6 h-6 text-[#FB9129]" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-brand-text-primary">Credit Card / Mobile Money</h3>
                  <p className="text-xs text-brand-text-secondary">Secure payment processing</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-[#FB9129]">
                <div className="w-2.5 h-2.5 bg-[#FB9129] rounded-full" />
              </div>
            </div>
          </div>

          <button 
            onClick={handlePayment}
            disabled={isProcessing || amount <= 0}
            className={`w-full py-4 rounded-xl font-bold text-white transition-transform ${isProcessing ? 'bg-brand-secondary cursor-wait' : 'bg-[#FB9129] hover:scale-[1.02]'}`}
          >
            {isProcessing ? 'Processing Securely...' : `Complete $${amount} ${type === 'monthly' ? 'Monthly ' : ''}Payment`}
          </button>
          
          <p className="text-center text-xs text-brand-text-secondary mt-4">
            Accepts international cards and local mobile money.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default GivingPage;
