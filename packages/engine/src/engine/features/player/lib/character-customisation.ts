let _postView = 'DefaultView';

export function setPostCharacterCreationView(viewId: string) {
  _postView = viewId;
}

export function getPostCharacterCreationView(): string {
  return _postView;
}
