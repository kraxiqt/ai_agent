import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { ROUTES } from '@/app/router/routes';
import { LoginForm, useLogin } from '@/features/auth';
import type { LoginDto } from '@/features/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useLogin();

  const handleSubmit = async (dto: LoginDto) => {
    try {
      await login(dto);
    } catch {
      return; // ошибка уже отображена через `error` из useLogin
    }
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? ROUTES.CHAT;
    navigate(from, { replace: true });
  };

  return (
    <>
      <h2 className="mb-4 text-lg font-medium">Вход</h2>
      <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
    </>
  );
}
