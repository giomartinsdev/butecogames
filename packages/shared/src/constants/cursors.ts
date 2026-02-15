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
  {
    id: "cursor_3",
    label: "Skate na veia!",
    cursorUrl: "/cursors/cursor_3.gif",
    pointerUrl: "/cursors/cursor_pointer_3.gif",
  },
  {
    id: "cursor_4",
    label: "MONSTER!!!",
    cursorUrl: "/cursors/cursor_4.png",
    pointerUrl: "/cursors/cursor_pointer_4.png",
  },
  {
    id: "cursor_5",
    label: "Hatsune Miku!!!",
    cursorUrl: "/cursors/cursor_5.png",
    pointerUrl: "/cursors/cursor_pointer_5.png",
  },
  {
    id: "cursor_6",
    label: "Sakamoto Lamén!",
    cursorUrl: "/cursors/cursor_6.png",
    pointerUrl: "/cursors/cursor_pointer_6.png",
  },
  {
    id: "cursor_7",
    label: "Stone",
    cursorUrl: "/cursors/cursor_7.png",
    pointerUrl: "/cursors/cursor_pointer_7.png",
  },
  {
    id: "cursor_8",
    label: "Caveman",
    cursorUrl: "/cursors/cursor_8.png",
    pointerUrl: "/cursors/cursor_pointer_8.png",
  },
  {
    id: "cursor_9",
    label: "Cool Blue",
    cursorUrl: "/cursors/cursor_9.png",
    pointerUrl: "/cursors/cursor_pointer_9.png",
  },
  {
    id: "cursor_10",
    label: "Green Skull",
    cursorUrl: "/cursors/cursor_10.png",
    pointerUrl: "/cursors/cursor_pointer_10.png",
  },
  {
    id: "cursor_11",
    label: "Ice and Fire",
    cursorUrl: "/cursors/cursor_11.png",
    pointerUrl: "/cursors/cursor_pointer_11.png",
  },
  {
    id: "cursor_12",
    label: "Gênio da Lâmpada",
    cursorUrl: "/cursors/cursor_12.png",
    pointerUrl: "/cursors/cursor_pointer_12.png",
  },
  {
    id: "cursor_13",
    label: "Maromba",
    cursorUrl: "/cursors/cursor_13.png",
    pointerUrl: "/cursors/cursor_pointer_13.png",
  },
  {
    id: "cursor_14",
    label: "Dan Da Dan!",
    cursorUrl: "/cursors/cursor_14.png",
    pointerUrl: "/cursors/cursor_pointer_14.png",
  },
  {
    id: "cursor_15",
    label: "Dan Da Dan! - Velha Turbo",
    cursorUrl: "/cursors/cursor_15.png",
    pointerUrl: "/cursors/cursor_pointer_15.png",
  },
  {
    id: "cursor_16",
    label: "GTA - Sweet",
    cursorUrl: "/cursors/cursor_16.png",
    pointerUrl: "/cursors/cursor_pointer_16.png",
  },
];

export const DEFAULT_CURSOR_SET_ID = "default";
export const DEFAULT_CURSOR_SIZE = 32;
