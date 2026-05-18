import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function AuthShellLayout() {
  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-none mx-auto px-4 lg:px-6 py-10">
        <div className="mx-auto w-full max-w-xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
