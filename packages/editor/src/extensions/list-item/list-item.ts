/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { ListItem as TiptapListItem } from "@tiptap/extension-list-item";

export const ListItem = TiptapListItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      indent: {
        default: 0,
        parseHTML: (element) => parseInt(element.dataset.indent || "0", 10) || 0,
        renderHTML: (attributes) => ({
          'data-indent': attributes.indent,
          style: `margin-left: ${attributes.indent * 20}px`
        })
      }
    };
  },
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: ({ editor }) => {
        console.log("Tab pressed in ListItem");
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        let depth = $from.depth;
        let listItemPos = null;
        while (depth > 0) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            listItemPos = $from.before(depth);
            break;
          }
          depth--;
        }
        if (listItemPos === null) return false;
        const listItemNode = state.doc.nodeAt(listItemPos);
        if (!listItemNode) return false;
        const currentIndent = listItemNode.attrs.indent || 0;
        console.log("Current indent:", currentIndent);
        const tr = state.tr.setNodeMarkup(listItemPos, undefined, { indent: Math.min(16, currentIndent + 1) });
        editor.view.dispatch(tr);
        return true;
      },
      'Shift-Tab': ({ editor }) => {
        console.log("Shift-Tab pressed in ListItem");
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        let depth = $from.depth;
        let listItemPos = null;
        while (depth > 0) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            listItemPos = $from.before(depth);
            break;
          }
          depth--;
        }
        if (listItemPos === null) return false;
        const listItemNode = state.doc.nodeAt(listItemPos);
        if (!listItemNode) return false;
        const currentIndent = listItemNode.attrs.indent || 0;
        console.log("Current indent:", currentIndent);
        const tr = state.tr.setNodeMarkup(listItemPos, undefined, { indent: Math.max(0, currentIndent - 1) });
        editor.view.dispatch(tr);
        return true;
      }
    };
  }
});
