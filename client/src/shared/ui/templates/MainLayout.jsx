import { Outlet } from 'react-router-dom';
import { Navbar } from '@ui/organisms';
import { FloatingBackButton } from '@ui/molecules';

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <FloatingBackButton />
      <Outlet />
    </>
  );
}
