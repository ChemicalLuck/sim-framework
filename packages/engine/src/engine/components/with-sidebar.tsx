import { MobileMenuHandle } from './mobile-menu-handle';
import { MobileTopBar } from './mobile-top-bar';
import { useSidebarComponent } from './sidebar/context';
import { Card } from './ui/card';

function WithSidebar({ children }: React.PropsWithChildren) {
  const Sidebar = useSidebarComponent();

  return (
    <>
      <Sidebar />
      <div className="relative flex min-h-svh min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1 px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-12">
          {/* Edge to edge on phones; a framed card from tablet width up. */}
          <Card className="mx-auto min-h-full max-w-4xl gap-5 rounded-none border-0 bg-transparent py-0 shadow-none md:gap-6 md:rounded-xl md:border md:bg-card md:p-6 md:shadow-sm">
            {children}
          </Card>
        </main>
        <MobileMenuHandle />
      </div>
    </>
  );
}

export default WithSidebar;
