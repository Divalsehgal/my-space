import { render, screen, fireEvent } from '@testing-library/react';
import ImageLightbox from './index';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-testid="lightbox-img" />
  ),
}));

describe('ImageLightbox', () => {
  const asset = {
    url: 'https://images.ctfassets.net/sample.png',
    title: 'Expanded view test',
    width: 800,
    height: 450,
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ImageLightbox isOpen={false} asset={asset} onClose={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal dialog and triggers onClose on close button click', () => {
    const handleClose = jest.fn();
    render(<ImageLightbox isOpen={true} asset={asset} onClose={handleClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Expanded view test')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close full view/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
