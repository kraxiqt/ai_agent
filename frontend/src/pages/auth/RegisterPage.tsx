import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/routes';
import { RegisterForm, useRegister } from '@/features/auth';
import type { RegisterDto } from '@/features/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useRegister();

  const handleSubmit = async (dto: RegisterDto) => {
    try {
      await register(dto);
    } catch {
      return; //ошибка уже отображена через error в useRegister
    }
    //сессия уже установлена в useRegister, просто уходим в чат.
    navigate(ROUTES.CHAT, { replace: true });
  };

  return (
    <>
      <h2 className="mb-4 text-lg font-medium">Регистрация</h2>
      <RegisterForm onSubmit={handleSubmit} loading={loading} error={error} />
    </>
  );
}
