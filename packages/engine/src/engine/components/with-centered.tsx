function WithCentered({ children }: React.PropsWithChildren) {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center p-8 text-center">
      {children}
    </main>
  );
}

export default WithCentered;
