import { vi } from 'vitest';

export const routerState = {
  params: {} as Record<string, string>,
  navigate: vi.fn(),
};

export function setupRouterMock() {
  vi.mock('react-router-dom', async (importOriginal) => {
    const mod = await importOriginal<typeof import('react-router-dom')>();
    return {
      ...mod,
      useParams: () => routerState.params,
      useNavigate: () => routerState.navigate,
    };
  });
}

export function resetRouterMock() {
  routerState.params = {};
  routerState.navigate = vi.fn();
}
