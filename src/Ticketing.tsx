import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Video, Key, Calendar, MapPin, Heart } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const TicketModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fallback public key for testing since user hasn't provided one
  const publicKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_b867c2eefe42df8763ac73c1dcc73468bfbdf8a1";
  const amount = 100 * 100; // 100 NGN in kobo

  const handlePaystackSuccessAction = async (reference: any) => {
    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        name,
        email,
        amount: 100,
        reference: reference.reference,
        status: 'paid',
        createdAt: serverTimestamp()
      });
      // Generate a short ticket ID from the document ID
      setTicketId(docRef.id.slice(-6).toUpperCase());
      setIsSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
      alert("Payment successful but failed to save ticket. Please contact support with reference: " + reference.reference);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaystackCloseAction = () => {
    console.log('Payment modal closed');
  };

  const componentProps = {
    email,
    amount,
    metadata: {
      name,
      custom_fields: []
    },
    publicKey,
    text: "Pay ₦100 & Get Ticket",
    onSuccess: (reference: any) => handlePaystackSuccessAction(reference),
    onClose: handlePaystackCloseAction,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-600/10 rounded-full blur-3xl" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all text-white"
        >
          <X size={16} />
        </button>

        <div className="relative z-10 p-8">
          {!isSuccess ? (
            <>
              <div className="mb-6">
                <span className="text-gold-500 font-black text-[10px] uppercase tracking-[0.3em] bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20">
                  Exclusive Access
                </span>
                <h3 className="text-2xl font-serif text-white mt-4 mb-2">Get Your Ticket</h3>
                <p className="text-stone-400 text-sm">Valid for both in-person attendance at Obot Eyo, Odukpani LGA and the exclusive live stream. Price: ₦100</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="w-full py-4 rounded-xl bg-stone-800 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-gold-500"></div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-600 to-gold-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className={`relative ${(!name || !email) ? 'opacity-50 pointer-events-none' : ''}`}>
                    <PaystackButton 
                      {...componentProps} 
                      className="w-full bg-gold-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl transition-transform active:scale-[0.98]" 
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
             <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-serif text-white mb-2">Ticket Secured!</h3>
              <p className="text-stone-400 text-sm mb-8">Thank you, {name}. Your payment was successful.</p>
              
              <div className="bg-stone-950/50 border border-stone-800 rounded-2xl p-5 mb-8 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Key size={16} className="text-gold-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Ticket ID</p>
                    <p className="text-white font-mono">{ticketId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar size={16} className="text-gold-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Save the Date</p>
                    <p className="text-white text-sm">April 26, 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <MapPin size={16} className="text-gold-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Location</p>
                    <p className="text-white text-sm">Obot Eyo, Odukpani LGA, Cross River State</p>
                  </div>
                </div>
                <div className="border-t border-stone-800 pt-4 mt-4">
                  <a 
                    href="https://youtube.com/live/some-private-link" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-colors font-medium text-sm"
                  >
                    <Video size={16} className="text-red-500" /> View Live Stream link
                  </a>
                  <p className="text-center text-stone-500 text-[10px] mt-2">The stream will go active on the event day.</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="text-stone-400 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const DonateModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [customAmount, setCustomAmount] = useState('1000');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const publicKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_b867c2eefe42df8763ac73c1dcc73468bfbdf8a1";
  const amount = parseInt(customAmount) * 100 || 0; 

  const handlePaystackSuccessAction = async (reference: any) => {
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        name,
        email,
        amount: parseInt(customAmount),
        type: 'donation',
        reference: reference.reference,
        status: 'paid',
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
      alert("Donation successful but receipt failed to save. Reference: " + reference.reference);
    } finally {
      setIsLoading(false);
    }
  };

  const componentProps = {
    email,
    amount,
    metadata: { name, custom_fields: [] },
    publicKey,
    text: `Support with ₦${customAmount || 0}`,
    onSuccess: (reference: any) => handlePaystackSuccessAction(reference),
    onClose: () => console.log('Donation modal closed'),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-600/10 rounded-full blur-3xl" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all text-white"
        >
          <X size={16} />
        </button>

        <div className="relative z-10 p-8">
          {!isSuccess ? (
            <>
              <div className="mb-6 text-center">
                <div className="w-12 h-12 bg-gold-500/10 text-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} />
                </div>
                <h3 className="text-2xl font-serif text-white mb-2">Support the Ministry</h3>
                <p className="text-stone-400 text-sm">Your generous donation helps us spread the word of hope and healing globally.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">Donation Amount (₦)</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors font-mono text-lg"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="w-full py-4 rounded-xl bg-stone-800 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-gold-500"></div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-600 to-gold-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className={`relative ${(!name || !email || amount < 10000) ? 'opacity-50 pointer-events-none' : ''}`}>
                    <PaystackButton 
                      {...componentProps} 
                      className="w-full bg-gold-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl transition-transform active:scale-[0.98]" 
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
             <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart fill="currentColor" size={32} />
              </div>
              <h3 className="text-2xl font-serif text-white mb-2">God Bless You!</h3>
              <p className="text-stone-400 text-sm mb-8">Thank you, {name}, for your generous support of ₦{customAmount}. Your contribution means the world to us.</p>
              
              <button 
                onClick={onClose}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-colors font-medium text-sm"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
