import { Outlet } from 'react-router-dom';

//Если появятся другие защищённые страницы без своего хедера, сюда можно вернуть общий widgets/Header.

export function MainLayout() {
  return <Outlet />;
}
