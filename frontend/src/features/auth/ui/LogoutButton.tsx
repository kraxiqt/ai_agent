import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/routes';
import { Button, type ButtonProps } from '@/shared/ui';
import { useLogout } from '../model/hooks';

export function LogoutButton(props: Omit<ButtonProps, 'onClick' | 'children'>) {
  const navigate = useNavigate();
  const { logout, loading } = useLogout();

  const handleClick = async () => {
    //сессия чистится внутри useLogout независимо от результата запроса. Мы всегда уходим на /login.
    await logout().catch(() => {});
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <Button variant="ghost" size="sm" loading={loading} onClick={() => void handleClick()} {...props}>
      Выйти
    </Button>
  );
}
