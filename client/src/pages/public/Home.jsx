import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { FiArrowRight, FiCheckCircle, FiStar, FiZap, FiTrendingUp, FiUsers, FiClock } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import InitialApplicationForm from '../../components/forms/InitialApplicationForm';
import nxtWaveLogo from '/logo.svg'; // Assuming you have the logo here

// --- Reusable Animated Component for Sections ---
const AnimatedSection = ({ children, className = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.section>
    );
};


// --- Page Sections ---

const HeroSection = ({ onApplyNowClick }) => (
    <section className="relative text-white py-32 sm:py-40">
        <div className="absolute inset-0 -z-10 bg-black"></div>
        {/* Aurora Background Effect */}
        <div 
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
        >
            <div 
                className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                style={{
                    clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
                }}
            />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="mx-auto max-w-3xl">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                        For <span className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">Industry Experts</span>,
                        <br/>
                        Shaping Tomorrow's Tech Talent.
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Leverage your expertise to mentor aspiring developers, earn competitive compensation, and enjoy unparalleled flexibility. Join an elite network dedicated to identifying the <span className="text-cyan-400 font-medium">next wave of talent</span>.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <button
                            onClick={onApplyNowClick}
                            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-4 px-8 text-lg font-medium text-white shadow-lg transition-transform duration-300 ease-out hover:scale-105"
                        >
                             <span className="absolute inset-0 flex-1 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 transition-all duration-300 ease-out group-hover:from-fuchsia-700 group-hover:via-purple-700 group-hover:to-cyan-700"></span>
                            <span className="relative">Apply to Join Us</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
         <div 
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
        >
            <div 
                className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                style={{
                    clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
                }}
            />
        </div>
    </section>
);

const CompaniesSection = () => (
    <div className="bg-[#0B0C1E] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-center text-lg font-semibold leading-8 text-gray-300">
                Our interviewers are seasoned professionals from leading tech companies
            </h2>
            <div className="mx-auto mt-10 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
                {[ 'Dell', 'GitLab', 'Google', 'GitHub', 'IBM', 'MicroStrategy', 'aws', 'verizon', 'ebay', 'Shell' ].map((company) => (
                    <img
                        key={company}
                        className="col-span-2 max-h-8 w-full object-contain lg:col-span-1 filter grayscale contrast-[0.5] opacity-50 transition duration-300 hover:filter-none hover:opacity-100"
                        src={`https://img.shields.io/badge/${company}-grey?style=for-the-badge&logo=${company.toLowerCase().replace(' ', '')}`}
                        alt={company}
                        width={158}
                        height={48}
                    />
                ))}
            </div>
        </div>
    </div>
);

const BenefitCard = ({ icon, title, children }) => (
    <div className="relative overflow-hidden rounded-2xl bg-[#14162B] p-8 shadow-2xl shadow-black/20 border border-white/5">
         <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
        <div className="relative z-10">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white mb-6">
                {React.createElement(icon, { className: 'h-6 w-6' })}
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-2 text-base text-gray-400">
                {children}
            </p>
        </div>
    </div>
);

const BenefitsSection = () => (
    <AnimatedSection className="bg-[#0B0C1E] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
                <p className="text-base font-semibold leading-7 text-cyan-400">Why Join Us?</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    A Platform Designed for Your Expertise
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                    We handle the logistics so you can focus on what you do best: identifying exceptional talent and making a lasting impact.
                </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                    <BenefitCard icon={FiZap} title="Competitive Compensation">
                        Earn up to ₹1250 per interview with a transparent, tier-based payment system. Your expertise is valued and rewarded.
                    </BenefitCard>
                    <BenefitCard icon={FiClock} title="Unmatched Flexibility">
                        Define your own schedule. Accept interviews that fit your life, not the other way around. Work from anywhere, anytime.
                    </BenefitCard>
                    <BenefitCard icon={FiUsers} title="Elite Professional Network">
                        Join and connect with a curated community of over 500+ top-tier tech professionals and industry leaders.
                    </BenefitCard>
                </dl>
            </div>
        </div>
    </AnimatedSection>
);

const TestimonialCard = ({ quote, name, title, avatar }) => (
     <figure className="rounded-2xl bg-[#14162B] p-8 text-sm leading-6 border border-white/5 h-full flex flex-col">
        <blockquote className="text-gray-300 flex-grow">
            <p>{`“${quote}”`}</p>
        </blockquote>
        <figcaption className="mt-6 flex items-center gap-x-4">
            <img className="h-10 w-10 rounded-full bg-gray-700" src={avatar} alt="" />
            <div>
                <div className="font-semibold text-white">{name}</div>
                <div className="text-gray-400">{title}</div>
            </div>
        </figcaption>
    </figure>
);

const TestimonialsSection = () => (
    <AnimatedSection className="bg-[#0B0C1E] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-xl text-center">
                <p className="text-lg font-semibold leading-8 tracking-tight text-cyan-400">Testimonials</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Hear from our interviewer community</h2>
            </div>
            <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <TestimonialCard
                        quote="Being an interviewer with NxtWave is a game-changer. I can take on interviews whenever I have a spare hour, which fits perfectly around my full-time job. The platform is seamless."
                        name="Priya S."
                        title="Senior Software Engineer at Google"
                        avatar="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                    />
                     <TestimonialCard
                        quote="It's incredibly rewarding to see the 'aha' moments from candidates. I'm not just interviewing; I'm mentoring. It feels great to give back and help shape careers."
                        name="Rohan M."
                        title="Engineering Manager at Microsoft"
                        avatar="https://i.pravatar.cc/150?u=a042581f4e29026705d"
                    />
                     <TestimonialCard
                        quote="The quality of candidates and the structured process at NxtWave are top-notch. It’s a great way to stay connected with the broader tech community and sharpen my own evaluation skills."
                        name="Anjali K."
                        title="Tech Lead at Amazon"
                        avatar="https://i.pravatar.cc/150?u=a042581f4e29026706d"
                    />
                </div>
            </div>
        </div>
    </AnimatedSection>
);


// --- Main Home Page Component ---
const Home = () => {
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.hash === '#apply') {
            setIsApplicationModalOpen(true);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    const handleApplyNowClick = () => setIsApplicationModalOpen(true);
    const handleCloseModal = () => setIsApplicationModalOpen(false);
    
    return (
        <div className="bg-[#0B0C1E] text-gray-200 font-sans antialiased">
            <main>
                <HeroSection onApplyNowClick={handleApplyNowClick} />
                <CompaniesSection />
                <BenefitsSection />
                <TestimonialsSection />
            </main>
            
            <Modal
                isOpen={isApplicationModalOpen}
                onClose={handleCloseModal}
                title="Apply to Become a NxtWave Interviewer"
                size="2xl"
            >
                <p className="text-gray-600 mb-6">
                    Thank you for your interest. Please fill out the form below to start your application.
                </p>
                <InitialApplicationForm onSuccess={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default Home;
