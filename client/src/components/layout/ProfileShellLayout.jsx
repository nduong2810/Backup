import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function ProfileShellLayout() {
  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-none mx-auto px-4 lg:px-6 pt-3 lg:pt-4 pb-8">
        <div className="mx-auto w-full max-w-[1440px]">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
