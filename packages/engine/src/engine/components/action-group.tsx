import React from 'react';

interface ActionGroupProps {
  children: React.ReactNode;
}

export function ActionGroup({ children }: ActionGroupProps) {
  return <div className="flex flex-col gap-6">{children}</div>;
}
