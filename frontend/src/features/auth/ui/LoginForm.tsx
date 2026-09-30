import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/shared/ui';
import { ROUTES } from '@/app/router/routes';
import type { LoginDto } from '../model/types';

interface LoginFormProps {
  onSubmit: (dto: LoginDto) => void | Promise<void>;
  loading?: boolean;
  //ошибка запроса
  error?: string;
}

export function LoginForm({ onSubmit, loading = false, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Пароль"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" fullWidth loading={loading}>
        Войти
      </Button>
      <p className="text-center text-sm text-ink-600 dark:text-ink-400">
        Нет аккаунта?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-brand-700 underline dark:text-brand-400">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
