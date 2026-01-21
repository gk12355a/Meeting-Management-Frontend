import React, { useEffect, useState } from "react";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageLightbox({ open, onClose, images = [], initialIndex = 0 }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = "hidden"; // Prevent scrolling
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open, initialIndex]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") prevImage();
            if (e.key === "ArrowRight") nextImage();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, currentIndex]);

    const nextImage = (e) => {
        if (e) e.stopPropagation();
        if (images.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }
    };

    const prevImage = (e) => {
        if (e) e.stopPropagation();
        if (images.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center"
                    onClick={onClose}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 p-2 rounded-full transition-colors z-[70]"
                    >
                        <FiX size={32} />
                    </button>

                    {/* Controls */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 p-3 rounded-full transition-colors z-[70] hidden sm:block"
                            >
                                <FiChevronLeft size={32} />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 p-3 rounded-full transition-colors z-[70] hidden sm:block"
                            >
                                <FiChevronRight size={32} />
                            </button>
                        </>
                    )}

                    {/* Main Image */}
                    <div
                        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image area/empty space if strictly desired, but normally lightbox closes on background click. Here, we want close on background.
                    >
                        <motion.img
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            src={images[currentIndex]}
                            alt={`Image ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            drag={images.length > 1 ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = offset.x; // simple horizontal swipe
                                if (swipe < -100) {
                                    nextImage();
                                } else if (swipe > 100) {
                                    prevImage();
                                }
                            }}
                        />

                        {/* Counter */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
