import { useSidebarComponent } from './sidebar/context';
import { Card } from './ui/card';

function WithSidebar({ children }: React.PropsWithChildren) {
  const Sidebar = useSidebarComponent();

  return (
    <>
      <Sidebar />
      <div className="relative flex w-[var(--main-width)] flex-1 items-center justify-center">
        <main className="size-full p-12">
          <Card className="p-6 max-w-4xl mx-auto min-h-full">{children}</Card>
        </main>
      </div>
    </>
  );
}

export default WithSidebar;
