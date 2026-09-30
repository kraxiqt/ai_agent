import { RouterProvider } from 'react-router-dom';
import { setupAuthInterceptors } from '@/features/auth';
import { AppProviders } from './providers';
import { router } from './router';

setupAuthInterceptors();

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
