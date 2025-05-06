import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGES_BASE_URL } from '@/config/api';

interface BannerSlide {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor?: string;
}

const bannerData: BannerSlide[] = [
  {
    id: 1,
    title: 'Latest Gaming Laptops',
    description: 'Experience next-level gaming with RTX 4000 series',
    imageUrl: '/static/images/lap1.jpg',
    buttonText: 'Shop Now',
    buttonLink: '/category/gaming-laptops',
    backgroundColor: '#1a237e',
  },
  {
    id: 2,
    title: 'Premium Ultrabooks',
    description: 'Lightweight and powerful laptops for professionals',
    imageUrl: '/static/images/lap2.jpg',
    buttonText: 'Explore',
    buttonLink: '/category/ultrabooks',
    backgroundColor: '#004d40',
  },
  {
    id: 3,
    title: 'Special Offers',
    description: 'Save up to 30% on selected laptops this month',
    imageUrl: '/static/images/lap3.jpg',
    buttonText: 'View Offers',
    buttonLink: '/special-offers',
    backgroundColor: '#b71c1c',
  },
];

const HeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % bannerData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % bannerData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + bannerData.length) % bannerData.length);
  };

  return (
    <div className="relative overflow-hidden h-[300px] sm:h-[400px] md:h-[500px]">
      {/* Slides */}
      {bannerData.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 flex items-center transition-opacity duration-700",
            currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
          style={{
            background: `linear-gradient(45deg, ${slide.backgroundColor}e0 20%, ${slide.backgroundColor}80 100%)`
          }}
        >
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Content */}
              <div className="w-full md:w-1/2 text-center md:text-left text-white z-10">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-md">
                  {slide.title}
                </h1>
                <p className="text-base sm:text-lg md:text-xl mb-6 opacity-90">
                  {slide.description}
                </p>
                <Link
                  to={slide.buttonLink}
                  className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-lg font-medium text-black hover:bg-white/90 transition-colors"
                >
                  {slide.buttonText}
                </Link>
              </div>
              
              {/* Image */}
              <div className="w-full md:w-1/2 flex justify-center">
                <img
                  src={`${IMAGES_BASE_URL}${slide.imageUrl.replace('/static/images/', '')}`}
                  alt={slide.title}
                  className="max-h-[200px] sm:max-h-[300px] md:max-h-[400px] object-contain drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/40 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/40 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {bannerData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              currentSlide === index 
                ? "bg-white" 
                : "bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;