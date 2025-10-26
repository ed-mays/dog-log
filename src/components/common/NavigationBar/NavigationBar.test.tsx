import { render } from '@test-utils';
import { NavigationBar } from './NavigationBar';

describe('NavigationBar', () => {
  test('renders without crashing in a Router context', () => {
    render(<NavigationBar />);
    // No assertions yet; smoke render only.
  });
});
