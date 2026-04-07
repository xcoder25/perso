import React, { useState, useEffect, FormEvent, ReactNode, Component, ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Mail, 
  Instagram, 
  Twitter, 
  Facebook, 
  Youtube, 
  Play, 
  Pause, 
  ChevronRight, 
  Menu, 
  X,
  Mic2,
  Heart,
  MapPin,
  ExternalLink,
  Music,
  Headphones,
  AlertCircle,
  Lock,
  LogOut,
  Trash2,
  Clock,
  User,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType, googleProvider } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, signInWithPopup, signOut } from 'firebase/auth';
import princeJamesImage from './assets/pj.jpeg';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = 'Something went wrong. Please try again later.';
      try {
        const parsedError = JSON.parse(this.state.error?.message || '');
        if (parsedError.error) {
          errorMessage = `Error: ${parsedError.error}`;
        }
      } catch (e) {
        // Not a JSON error, use default
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Oops!</h2>
            <p className="text-stone-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gold-600 text-white px-6 py-2 rounded-full font-bold hover:bg-gold-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Admin Dashboard ---
interface Booking {
  id: string;
  name: string;
  email: string;
  date: string;
  message: string;
  createdAt: Timestamp;
}

const AdminDashboard = ({ onLogout, onBack }: { onLogout: () => void, onBack: () => void }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bookings/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-3 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-stone-200 rounded-full transition-colors shrink-0"
              title="Back to Website"
            >
              <ArrowLeft size={20} className="text-stone-600 sm:w-6 sm:h-6" />
            </button>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">Admin</h1>
                <ShieldCheck className="text-gold-600 shrink-0" size={20} />
              </div>
              <p className="text-xs sm:text-sm text-stone-500">Manage bookings</p>
            </div>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-white/50 p-2 rounded-2xl md:bg-transparent md:p-0">
            <div className="text-left md:text-right">
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Admin</p>
              <p className="text-xs text-stone-600 truncate max-w-[150px] sm:max-w-none">{auth.currentUser?.email}</p>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-2 rounded-xl text-stone-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all text-xs sm:text-sm font-medium shadow-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-600 mb-4"></div>
            <p className="text-stone-400 font-serif italic">Loading inquiries...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-stone-100">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-stone-200" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-2">No bookings yet</h3>
            <p className="text-stone-500 max-w-xs mx-auto">When fans or event organizers message you, they'll appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="flex items-center justify-between px-2">
              <p className="text-sm text-stone-400 font-medium uppercase tracking-widest">
                Latest Inquiries ({bookings.length})
              </p>
            </div>
            {bookings.map((booking) => (
              <motion.div 
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-stone-100 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4 sm:gap-8">
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <h3 className="text-xl sm:text-2xl font-serif text-stone-900">{booking.name}</h3>
                      <span className="text-[9px] sm:text-[10px] bg-gold-50 text-gold-700 px-2 sm:px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] border border-gold-100">
                        {booking.date}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-stone-400 text-[11px] sm:text-sm mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 group-hover:text-stone-600 transition-colors truncate">
                        <Mail size={14} className="text-gold-500 shrink-0" /> {booking.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="shrink-0" /> {booking.createdAt?.toDate().toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-3 sm:-left-4 top-0 bottom-0 w-1 bg-gold-100 rounded-full"></div>
                      <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap pl-3 sm:pl-4">
                        {booking.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex md:flex-col justify-end items-center gap-2 mt-4 md:mt-0">
                    <button 
                      onClick={() => {
                        if (confirm('Delete this inquiry permanently?')) {
                          handleDelete(booking.id);
                        }
                      }}
                      disabled={deletingId === booking.id}
                      className="p-3 sm:p-4 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-2xl transition-all disabled:opacity-50"
                      title="Delete Inquiry"
                    >
                      {deletingId === booking.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-red-500"></div>
                      ) : (
                        <Trash2 size={20} className="sm:w-[22px] sm:h-[22px]" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Types ---
interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
}

// --- Mock Data ---
const UPCOMING_EVENTS: Event[] = [
  {
    id: 1,
    title: "New Album Launching",
    date: "April 26, 2026",
    location: "Obot Eyo, Odukpani LGA, Cross River State, Nigeria",
    description: "Join Minister James for the official launching of his highly anticipated new gospel album. A night of powerful worship and celebration."
  }
];

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Events', href: '#events' },
    { name: 'Booking', href: '#booking' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg py-3 border-b border-stone-100' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
        <motion.a 
          href="#home" 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-2xl sm:text-3xl font-serif font-black tracking-tighter transition-colors ${scrolled ? 'text-gold-800' : 'text-white'}`}
        >
          MINISTER <span className="text-gold-500 italic">JAMES</span>
        </motion.a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((link, idx) => (
            <motion.a 
              key={link.name} 
              href={link.href} 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`text-[11px] font-black tracking-widest uppercase hover:text-gold-500 transition-all hover:scale-110 active:scale-95 ${scrolled ? 'text-stone-700' : 'text-white'}`}
            >
              {link.name}
            </motion.a>
          ))}
          <motion.a 
            href="#booking"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${scrolled ? 'bg-gold-600 text-white hover:bg-gold-700 shadow-lg shadow-gold-600/20' : 'bg-white text-stone-900 hover:bg-gold-400 hover:text-white'}`}
          >
            Book Now
          </motion.a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 -mr-2 transition-transform active:scale-90" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className={scrolled ? 'text-stone-900' : 'text-white'} size={28} />
          ) : (
            <Menu className={scrolled ? 'text-stone-900' : 'text-white'} size={28} />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white md:hidden overflow-y-auto"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-12">
                <span className="text-xl font-serif font-bold tracking-tighter text-gold-800">MINISTER JAMES</span>
                <button onClick={() => setIsOpen(false)} className="p-2 text-stone-900">
                  <X size={32} />
                </button>
              </div>
              
              <div className="flex flex-col space-y-8 flex-grow">
                {navLinks.map((link, idx) => (
                  <motion.a 
                    key={link.name} 
                    href={link.href} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setIsOpen(false)}
                    className="text-stone-900 text-4xl font-serif flex justify-between items-center group active:text-gold-600 transition-colors"
                  >
                    {link.name}
                    <ChevronRight size={24} className="text-gold-500" />
                  </motion.a>
                ))}
              </div>

              <div className="pt-12 border-t border-stone-100">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400 mb-6 text-center">Connect With Us</p>
                <div className="flex gap-8 justify-center">
                  <a href="#" className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-600 active:bg-gold-50 active:text-gold-600 transition-all"><Instagram size={24} /></a>
                  <a href="#" className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-600 active:bg-gold-50 active:text-gold-600 transition-all"><Youtube size={24} /></a>
                  <a href="#" className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-600 active:bg-gold-50 active:text-gold-600 transition-all"><Facebook size={24} /></a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={princeJamesImage} 
          alt="Minister James Performing" 
          className="w-full h-full object-cover brightness-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-stone-950/80"></div>
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-6 inline-block"
        >
          <span className="text-gold-400 font-black tracking-[0.4em] uppercase text-[9px] sm:text-xs mb-4 block gold-glow">
            Spreading the Word Through Song
          </span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl sm:text-7xl md:text-9xl font-serif text-white mb-10 leading-[0.95] tracking-tighter"
        >
          A Voice of <br />
          <span className="italic text-gold-400 gold-glow">Hope</span> & <span className="font-sans font-extralight opacity-80 text-gold-100">Healing</span>
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4 sm:px-0"
        >
          <a href="#booking" className="w-full sm:w-auto gold-button bg-gold-600 hover:bg-gold-500 text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.1em] transition-all transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-3 shadow-2xl shadow-gold-900/40">
            Book for Performance
            <ChevronRight size={18} />
          </a>
          <a href="#events" className="w-full sm:w-auto group flex items-center justify-center gap-3 text-white font-bold uppercase tracking-widest text-xs hover:text-gold-300 transition-colors">
            Upcoming Events <div className="w-10 h-px bg-gold-500/50 group-hover:w-16 transition-all"></div>
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
      >
        <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent mx-auto"></div>
      </motion.div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 sm:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative order-2 md:order-1"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl">
              <img 
                src={princeJamesImage} 
                alt="Minister James Portrait" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-gold-600 text-white p-6 sm:p-8 rounded-2xl hidden sm:block max-w-[280px] shadow-2xl">
              <p className="font-serif italic text-lg sm:text-xl mb-2">"Music is the bridge between the soul and the Creator."</p>
              <p className="text-xs sm:text-sm font-medium opacity-80">— Minister James</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-1 md:order-2"
          >
            <span className="text-gold-600 font-bold uppercase tracking-widest text-xs mb-4 block">Our Story</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-stone-900 mb-6 leading-tight">The Journey of Faith</h2>
            <div className="space-y-6 text-stone-600 leading-relaxed text-base sm:text-lg">
              <p>
                Born into a family of worshippers, Minister James discovered his calling at the age of seven. What started as a small voice in a local choir has blossomed into a global music career that touches hearts and transforms lives.
              </p>
              <p>
                His music is more than just melody; it's a testimony of faith and grace. With a unique blend of contemporary gospel, soul, and traditional hymns, Minister James creates an atmosphere where listeners can find peace, strength, and spiritual renewal.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-8 border-t border-stone-100 pt-10">
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-3xl font-serif text-gold-700">15+</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 font-bold">Years</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-3xl font-serif text-gold-700">3</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 font-bold">Albums</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-3xl font-serif text-gold-700">500+</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-stone-400 font-bold">Events</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const EventsSection = () => {
  return (
    <section id="events" className="py-16 sm:py-24 bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-16 gap-6">
          <div>
            <span className="text-gold-500 font-bold uppercase tracking-widest text-xs mb-3 block">Live Experience</span>
            <h2 className="text-3xl sm:text-5xl font-serif mb-4">Upcoming Performances</h2>
            <p className="text-stone-400 max-w-xl text-sm sm:text-base">Join Minister James for an experience of worship and connection at these upcoming locations.</p>
          </div>
          <a href="#" className="text-gold-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2 hover:text-gold-300 transition-colors">
            View All Dates <ChevronRight size={16} />
          </a>
        </div>

        <div className="grid gap-6">
          {UPCOMING_EVENTS.map((event, idx) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group glass-dark p-6 sm:p-10 rounded-[2rem] hover:bg-white/10 transition-all flex flex-col md:flex-row md:items-center gap-6 sm:gap-10 border border-white/10"
            >
              <div className="md:w-40 shrink-0">
                <div className="text-gold-500 font-serif text-3xl sm:text-5xl mb-1 leading-none">{event.date.split(',')[0].split(' ')[1]}</div>
                <div className="text-stone-400 text-[10px] sm:text-xs uppercase tracking-[0.3em] font-black">{event.date.split(',')[0].split(' ')[0]} {event.date.split(',')[1]}</div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl sm:text-3xl font-serif mb-3 group-hover:text-gold-400 transition-colors tracking-tight">{event.title}</h3>
                <div className="flex items-center gap-3 text-stone-400 text-xs sm:text-sm bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
                  <MapPin size={14} className="text-gold-500" />
                  {event.location}
                </div>
              </div>
              <div className="md:w-72 text-stone-400 text-xs sm:text-sm leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity italic">
                "{event.description}"
              </div>
              <div className="shrink-0">
                <button className="w-full md:w-auto gold-button bg-white text-stone-900 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gold-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                  Tickets & Info
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StreamSection = () => {
  const platforms = [
    { 
      name: 'Audiomack', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 13h-2v-4h2v4zm-3 2h-2V7h2v10zm-3-2H8v-4h2v4z"/>
        </svg>
      ), 
      color: 'bg-[#FFA200]', 
      href: 'https://audiomack.com' 
    },
    { 
      name: 'Boomplay', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
      ), 
      color: 'bg-[#00A0E9]', 
      href: 'https://www.boomplay.com' 
    },
    { 
      name: 'YouTube', 
      icon: <Youtube size={20} />, 
      color: 'bg-[#FF0000]', 
      href: 'https://youtube.com' 
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 mb-4">Stream the Music</h2>
          <p className="text-stone-600 mb-10 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">Experience the uplifting sounds of Minister James on your favorite platforms.</p>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {platforms.map((p, idx) => (
              <motion.a 
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className={`${p.color} text-white px-8 py-5 rounded-[2rem] font-bold flex items-center justify-center gap-4 transition-all shadow-xl hover:shadow-2xl active:scale-95`}
              >
                <span className="p-2 bg-white/20 rounded-full">{p.icon}</span>
                <span className="tracking-[0.2em] uppercase text-[10px] sm:text-xs font-black">{p.name}</span>
              </motion.a>
            ))}
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-12 text-stone-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.4em]"
          >
            Available on all major platforms
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

const BookingSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const date = formData.get('date') as string;
    const message = formData.get('message') as string;

    const path = 'bookings';
    try {
      await addDoc(collection(db, path), {
        name,
        email,
        date,
        message,
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking" className="py-16 sm:py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden grid md:grid-cols-2">
          <div className="p-8 sm:p-12 bg-gold-800 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-700/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10">
              <span className="text-gold-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-4 block">Get in Touch</span>
              <h2 className="text-3xl sm:text-4xl font-serif mb-6">Booking & Inquiries</h2>
              <p className="text-gold-100 mb-10 text-base sm:text-lg leading-relaxed opacity-90">
                Interested in having Minister James perform at your event? Please fill out the form, and our team will get back to you within 48 hours.
              </p>
              
              <div className="space-y-5 sm:space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gold-300 font-bold">Email Us</p>
                    <p className="text-sm sm:text-lg font-medium truncate">efffiomz@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                    <Mic2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gold-300 font-bold">Management</p>
                    <p className="text-sm sm:text-lg font-medium truncate">+234 916 560 2336</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 mt-12 relative z-10">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><Youtube size={18} /></a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><Facebook size={18} /></a>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Heart fill="currentColor" size={32} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 mb-3">Thank You!</h3>
                <p className="text-stone-500 max-w-xs mx-auto">Your message has been received. We look forward to connecting with you.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Full Name</label>
                    <input 
                      required
                      name="name"
                      type="text" 
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all text-stone-800 placeholder:text-stone-300"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Email Address</label>
                    <input 
                      required
                      name="email"
                      type="email" 
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all text-stone-800 placeholder:text-stone-300"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Event Date</label>
                  <input 
                    required
                    name="date"
                    type="date" 
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all text-stone-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Message / Event Details</label>
                  <textarea 
                    required
                    name="message"
                    rows={4}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all text-stone-800 placeholder:text-stone-300 resize-none"
                    placeholder="Tell us about your event..."
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 ${
                    isSubmitting ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-gold-600 hover:bg-gold-700 text-white shadow-gold-600/30 hover:-translate-y-1'
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                  {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = ({ onAdminClick }: { onAdminClick?: () => void }) => {
  return (
    <footer className="bg-stone-950 text-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 border-b border-white/5 pb-16 mb-12">
          <div className="text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tighter mb-3">MINISTER JAMES</h2>
            <p className="text-stone-500 text-[10px] sm:text-xs uppercase tracking-[0.3em] font-bold">Gospel Music Artist</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            <a href="#home" className="text-stone-400 hover:text-gold-400 transition-colors text-sm font-bold uppercase tracking-widest">Home</a>
            <a href="#about" className="text-stone-400 hover:text-gold-400 transition-colors text-sm font-bold uppercase tracking-widest">About</a>
            <a href="#events" className="text-stone-400 hover:text-gold-400 transition-colors text-sm font-bold uppercase tracking-widest">Events</a>
          </div>

          <div className="flex gap-5">
            <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-gold-600 transition-all hover:-translate-y-1"><Instagram size={18} /></a>
            <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-gold-600 transition-all hover:-translate-y-1"><Youtube size={18} /></a>
            <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-gold-600 transition-all hover:-translate-y-1"><Facebook size={18} /></a>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 text-stone-600 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-center md:text-left">
          <p>© 2026 Minister James Music. All Rights Reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 items-center">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <button 
              onClick={onAdminClick}
              className="flex items-center gap-2 hover:text-gold-400 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5 active:bg-white/10"
            >
              <Lock size={10} /> Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [isAdminView, setIsAdminView] = useState(window.location.hash === '#admin');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminView(window.location.hash === '#admin');
    };
    window.addEventListener('hashchange', handleHashChange);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        signInAnonymously(auth).catch(err => console.error('Auth error:', err));
      }
    });
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsubscribe();
    };
  }, []);

  const handleAdminLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.hash = 'admin';
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.hash = '';
  };

  const isAdmin = user?.email === "xcoder2442@gmail.com";

  if (isAdminView && isAdmin) {
    return (
      <ErrorBoundary>
        <AdminDashboard 
          onLogout={handleLogout} 
          onBack={() => window.location.hash = ''} 
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-50 selection:bg-gold-200 selection:text-gold-900">
        <Navbar />
        <main>
          <Hero />
          <About />
          <EventsSection />
          <StreamSection />
          <BookingSection />
        </main>
        <Footer onAdminClick={() => isAdmin ? window.location.hash = 'admin' : handleAdminLogin()} />
      </div>
    </ErrorBoundary>
  );
}
