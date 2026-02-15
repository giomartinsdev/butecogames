export interface CursorSet {
  id: string;
  label: string;
  cursorUrl: string | null;
  pointerUrl: string | null;
}

export const CURSOR_SETS: CursorSet[] = [
  {
    id: "default",
    label: "Padrão",
    cursorUrl: null,
    pointerUrl: null,
  },
  {
    id: "cursor_1",
    label: "Buteco Clássico",
    cursorUrl: "/cursors/cursor_1.png",
    pointerUrl: "/cursors/cursor_pointer_1.png",
  },
  {
    id: "cursor_2",
    label: "Sabre de Luz",
    cursorUrl: "/cursors/cursor_2.gif",
    pointerUrl: "/cursors/cursor_pointer_2.gif",
  },
];

export const DEFAULT_CURSOR_SET_ID = "default";
export const DEFAULT_CURSOR_SIZE = 32;
