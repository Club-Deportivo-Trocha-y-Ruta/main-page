import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import TestimonialsCarousel from '../TestimonialsCarousel';

// Mock Swiper — Swiper es difícil de testear en jsdom, mock los componentes
vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper">{children}</div>
  ),
  SwiperSlide: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper-slide">{children}</div>
  ),
}));

vi.mock('swiper/modules', () => ({
  Autoplay: {},
  Pagination: {},
}));

vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/pagination', () => ({}));

const testimonials = [
  {
    id: 'maria',
    name: 'María Fernanda López',
    roleLabel: 'Madre de familia',
    quote: 'Mi hijo ha crecido mucho como deportista y como persona.',
    photo: '/photos/maria.jpg',
  },
  {
    id: 'carlos',
    name: 'Carlos Restrepo',
    roleLabel: 'Padre de familia',
    quote: 'Excelente club, se nota la dedicación.',
  },
];

describe('TestimonialsCarousel', () => {
  it('renderiza slides con testimonios', () => {
    render(<TestimonialsCarousel testimonials={testimonials} />);

    expect(screen.getByText(/Mi hijo ha crecido/)).toBeInTheDocument();
    expect(screen.getByText('María Fernanda López')).toBeInTheDocument();
    expect(screen.getByText('Madre de familia')).toBeInTheDocument();
  });

  it('renderiza todos los testimonios como slides', () => {
    render(<TestimonialsCarousel testimonials={testimonials} />);

    const slides = screen.getAllByTestId('swiper-slide');
    expect(slides).toHaveLength(2);
  });

  it('usa blockquote para las citas', () => {
    const { container } = render(<TestimonialsCarousel testimonials={testimonials} />);

    const blockquotes = container.querySelectorAll('blockquote');
    expect(blockquotes).toHaveLength(2);
  });

  it('usa cite para los nombres', () => {
    const { container } = render(<TestimonialsCarousel testimonials={testimonials} />);

    const cites = container.querySelectorAll('cite');
    expect(cites).toHaveLength(2);
  });

  it('retorna null cuando no hay testimonios', () => {
    const { container } = render(<TestimonialsCarousel testimonials={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<TestimonialsCarousel testimonials={testimonials} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
