import { vi } from 'vitest';

/**
 * Helper to mock react-router-dom's useNavigate and useParams.
 * Must be called BEFORE importing the component under test.
 *
 * @param params - The route params to return from useParams()
 * @param navigate - The mock function to return from useNavigate()
 * @returns object containing the navigate mock for assertions
 */
export function mockRouter(params = {}, navigate = vi.fn()) {
  vi.doMock('react-router-dom', async (importOriginal) => {
    const mod = await importOriginal<typeof import('react-router-dom')>();
    return {
      ...mod,
      useParams: () => params,
      useNavigate: () => navigate,
    };
  });
  return { navigate };
}
