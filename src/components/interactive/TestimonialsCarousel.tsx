import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface Testimonial {
  id: string;
  name: string;
  roleLabel: string;
  quote: string;
}

interface Props {
  testimonials: Testimonial[];
}

export default function TestimonialsCarousel({ testimonials }: Props) {
  if (testimonials.length === 0) return null;

  return (
    <>
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={testimonials.length > 1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="testimonials-swiper"
      >
        {testimonials.map((t) => (
          <SwiperSlide key={t.id}>
            <div className="max-w-3xl mx-auto text-center px-4 pb-12">
              <blockquote>
                <span className="block text-accent text-5xl leading-none font-display" aria-hidden="true">
                  &ldquo;
                </span>
                <p className="text-xl md:text-2xl font-display italic text-white leading-relaxed mt-2">
                  {t.quote}
                </p>
                <span className="block text-accent text-5xl leading-none font-display mt-2" aria-hidden="true">
                  &rdquo;
                </span>
              </blockquote>
              <div className="w-12 h-0.5 bg-accent mx-auto my-6" />
              <cite className="not-italic">
                <span className="block font-semibold text-white">{t.name}</span>
                <span className="block text-sm text-white/70 mt-1">{t.roleLabel}</span>
              </cite>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <style>{`
        .testimonials-swiper .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.4);
          opacity: 1;
        }
        .testimonials-swiper .swiper-pagination-bullet-active {
          background: #8be000;
        }
      `}</style>
    </>
  );
}
