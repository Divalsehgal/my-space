import { render, screen } from '@testing-library/react';
import ImageLoader from './index';

describe('ImageLoader', () => {
  it('renders loading state when isLoading is true', () => {
    render(<ImageLoader isLoading={true} />);
    const loader = screen.getByTestId('image-loader');
    expect(loader).toBeInTheDocument();
    expect(loader.className).not.toContain('shimmerHidden');
    expect(screen.getByText('Loading illustration…')).toBeInTheDocument();
  });

  it('adds shimmerHidden class when isLoading is false', () => {
    render(<ImageLoader isLoading={false} />);
    const loader = screen.getByTestId('image-loader');
    expect(loader.className).toContain('shimmerHidden');
  });
});
