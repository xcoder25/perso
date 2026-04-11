import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Video, Key, Calendar, MapPin, Heart } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { useRef, useMemo } from 'react';

export const TicketModal = ({ onClose }: { onClose: () => void }) => {
  const [ticketType, setTicketType] = useState<'regular' | 'vip'>('regular');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const downloadTicket = async () => {
    if (ticketRef.current === null) return;
    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, backgroundColor: '#0c0a09' });
      const link = document.createElement('a');
      link.download = `minister-james-${ticketType}-ticket-${ticketId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download ticket', err);
    }
  };

  // Fallback public key for testing since user hasn't provided one
  const publicKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_b867c2eefe42df8763ac73c1dcc73468bfbdf8a1";
  const prices = {
    regular: 200,
    vip: 500
  };
  const amount = prices[ticketType] * 100; // In kobo

  const handlePaystackSuccessAction = async (reference: any) => {
    // Show success UI immediately for better UX
    setIsSuccess(true);
    // Use the reference as a temporary ID if doc hasn't saved yet
    setTicketId(reference.reference.slice(-6).toUpperCase());

    // Background save to Firestore
    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        name,
        email,
        amount: prices[ticketType],
        ticketType,
        reference: reference.reference,
        status: 'paid',
        createdAt: serverTimestamp()
      });
      // Update with the actual document ID if different
      setTicketId(docRef.id.slice(-6).toUpperCase());
    } catch (error) {
      console.error("Firestore save error:", error);
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
    }
  };

  const handlePaystackCloseAction = () => {
    console.log('Payment modal closed');
  };

  const componentProps = useMemo(() => ({
    email,
    amount,
    metadata: {
      name,
      custom_fields: []
    },
    publicKey,
    text: `Pay ₦${prices[ticketType]} & Get ${ticketType.toUpperCase()} Ticket`,
    onSuccess: (reference: any) => handlePaystackSuccessAction(reference),
    onClose: handlePaystackCloseAction,
  }), [email, name, publicKey, ticketType]);

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

        <div className="relative z-10 p-6 sm:p-8">
          {!isSuccess ? (
            <>
              <div className="mb-6">
                <span className="text-gold-500 font-black text-[10px] uppercase tracking-[0.3em] bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20">
                  Exclusive Access
                </span>
                <h3 className="text-2xl font-serif text-white mt-4 mb-2">Get Your Ticket</h3>
                <p className="text-stone-400 text-sm">Valid for both in-person attendance at Obot Eyo and exclusive live stream.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setTicketType('regular')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${ticketType === 'regular' ? 'border-gold-500 bg-gold-500/10' : 'border-stone-800 bg-stone-900/50'}`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${ticketType === 'regular' ? 'text-gold-500' : 'text-stone-500'}`}>Regular</p>
                  <p className="text-white font-bold text-lg">₦200</p>
                </button>
                <button
                  onClick={() => setTicketType('vip')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${ticketType === 'vip' ? 'border-gold-500 bg-gold-500/10' : 'border-stone-800 bg-stone-900/50'}`}
                >
                  <div className="flex justify-between items-start">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${ticketType === 'vip' ? 'text-gold-500' : 'text-stone-500'}`}>VIP Access</p>
                    <Key size={12} className={ticketType === 'vip' ? 'text-gold-500' : 'text-stone-500'} />
                  </div>
                  <p className="text-white font-bold text-lg">₦500</p>
                </button>
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
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-xl font-serif text-white mb-1">Ticket Secured!</h3>
              <p className="text-stone-400 text-[10px] mb-6">Payment verified. A copy has been saved to our database.</p>

              {/* Visual Ticket Container */}
              <div className="relative mb-8">
                <div
                  ref={ticketRef}
                  className="bg-white rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-left"
                >
                  {/* Ticket Header */}
                  <div className="bg-stone-900 p-6 flex justify-between items-center border-b border-stone-800">
                    <div>
                      <p className="text-gold-500 font-black text-[9px] uppercase tracking-[0.3em] mb-1">Official Event Pass</p>
                      <h4 className="text-white font-serif text-xl leading-tight">Minister James</h4>
                      <p className="text-stone-400 text-[10px] mt-1 italic">Album Launching 2026</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                      <QRCodeSVG value={`TICKET-${ticketId}-${email}`} size={50} bgColor="white" fgColor="black" />
                    </div>
                  </div>

                  {/* Perforated Divider */}
                  <div className="relative h-px bg-stone-200 flex items-center">
                    <div className="absolute -left-3 top-[-8px] w-6 h-4 bg-stone-900 rounded-full" />
                    <div className="absolute -right-3 top-[-8px] w-6 h-4 bg-stone-900 rounded-full" />
                  </div>

                  {/* Ticket Primary Info */}
                  <div className="p-6 bg-white grid grid-cols-2 gap-y-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Guest</p>
                      <p className="text-stone-900 text-sm font-bold truncate">{name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Pass ID</p>
                      <p className="text-stone-900 font-mono text-sm font-black">{ticketId || '...'}</p>
                    </div>

                    <div className="col-span-2 bg-stone-50 rounded-xl p-3 flex justify-between items-center border border-stone-100">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Event Date</p>
                        <p className="text-stone-800 text-xs font-bold">April 26, 2026</p>
                      </div>
                      <div className="w-px h-6 bg-stone-200" />
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Door Opens</p>
                        <p className="text-stone-800 text-xs font-bold">4:00 PM</p>
                      </div>
                      <div className="w-px h-6 bg-stone-200" />
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Access</p>
                        <p className="text-stone-800 text-xs font-bold">{ticketType === 'vip' ? 'VIP - All Areas' : 'General Admission'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Decoration */}
                  <div className="px-6 pb-6 bg-white">
                    <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={10} className="text-gold-600" />
                        <span className="text-[9px] text-stone-500 font-medium">Obot Eyo, Odukpani LGA</span>
                      </div>
                      <div className="text-[9px] text-gold-600 font-black italic">MINISTER JAMES LIVE</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={downloadTicket}
                  className="w-full bg-gold-600 hover:bg-gold-500 text-white py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2"
                >
                  Download Digital Ticket
                </button>

                {navigator.share && (
                  <button
                    onClick={() => {
                      navigator.share({
                        title: 'Minister James Ticket',
                        text: `My ticket for Minister James Album Launch. Ticket ID: ${ticketId}`,
                        url: window.location.href
                      }).catch(console.error);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-colors font-medium text-xs flex items-center justify-center gap-2"
                  >
                    Share Ticket
                  </button>
                )}

                <a
                  href="https://youtube.com/live/some-private-link"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-colors font-medium text-xs"
                >
                  <Video size={14} className="text-red-500" /> Virtual Pass Access
                </a>
              </div>

              <button
                onClick={onClose}
                className="mt-6 text-stone-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-colors"
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

        <div className="relative z-10 p-6 sm:p-8">
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
