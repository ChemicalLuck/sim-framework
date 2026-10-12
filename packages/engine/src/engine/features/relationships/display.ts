import type { ComponentType } from 'react';

export interface RelationshipSectionProps {
  npcId: string;
}

/**
 * How NpcView shows a relationship: `values` lists each metric's number
 * (default), `hidden` leaves the section out, and a component renders the
 * section in its place.
 */
export type RelationshipDisplay =
  | 'values'
  | 'hidden'
  | ComponentType<RelationshipSectionProps>;

let display: RelationshipDisplay = 'values';

export function configureRelationshipDisplay(value: RelationshipDisplay) {
  display = value;
}

export function getRelationshipDisplay(): RelationshipDisplay {
  return display;
}
