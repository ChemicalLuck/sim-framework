export default function Roundel({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {count}
    </span>
  );
}
