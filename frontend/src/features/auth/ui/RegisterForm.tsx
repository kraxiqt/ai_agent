import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/shared/ui';
import { ROUTES } from '@/app/router/routes';
import type { RegisterDto } from '../model/types';

interface RegisterFormProps {
  onSubmit: (dto: RegisterDto) => void | Promise<void>;
  loading?: boolean;
  //ошибка запроса
  error?: string;
}

export function RegisterForm({ onSubmit, loading = false, error }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const mismatch = confirm.length > 0 && confirm !== password ? 'Пароли не совпадают' : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mismatch) return;
    void onSubmit({ name: name || undefined, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      <Input label="Имя" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
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
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="Повторите пароль"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={mismatch}
        required
      />
      <Button type="submit" fullWidth loading={loading}>
        Создать аккаунт
      </Button>
      <p className="text-center text-sm text-ink-600 dark:text-ink-400">
        Уже есть аккаунт?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-brand-700 underline dark:text-brand-400">
          Войти
        </Link>
      </p>
    </form>
  );
}
