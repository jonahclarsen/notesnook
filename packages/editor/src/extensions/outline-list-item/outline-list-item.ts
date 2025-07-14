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

import { mergeAttributes, Node } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { findParentNodeOfTypeClosestToPos } from "../../utils/prosemirror.js";
import { OutlineList } from "../outline-list/outline-list.js";

export interface ListItemOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const OutlineListItem = Node.create<ListItemOptions>({
  name: "outlineListItem",

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      collapsed: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.collapsed === "true",
        renderHTML: (attributes) => ({
          "data-collapsed": attributes.collapsed === true
        })
      },
      indent: {
        default: 0,
        parseHTML: (element) => parseInt(element.dataset.indent || "0", 10) || 0
      }
    };
  },

  content: "paragraph+ list?",

  defining: true,

  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name
      }),
      0
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Space": ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;

        if (!empty) return false;

        const listItem = findParentNodeOfTypeClosestToPos($from, this.type);
        if (!listItem) return false;

        const isCollapsed = listItem.node.attrs.collapsed;

        return editor.commands.command(({ tr }) => {
          tr.setNodeAttribute(listItem.pos, "collapsed", !isCollapsed);
          return true;
        });
      },
      Enter: () => {
        // const subList = findSublist(editor, this.type);
        // if (!subList) return this.editor.commands.splitListItem(this.name);

        // const { isCollapsed, subListPos } = subList;

        // if (isCollapsed) {
        //   return this.editor.commands.toggleOutlineCollapse(subListPos, false);
        // }

        return this.editor.commands.splitListItem(this.name);
      },
      Tab: ({ editor }) => {
        console.log("Tab pressed in OutlineListItem");
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        let depth = $from.depth;
        let outlineItemPos = null;
        while (depth > 0) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            outlineItemPos = $from.before(depth);
            break;
          }
          depth--;
        }
        if (outlineItemPos === null) return false;
        const outlineItemNode = state.doc.nodeAt(outlineItemPos);
        if (!outlineItemNode) return false;
        const currentIndent = outlineItemNode.attrs.indent || 0;
        console.log("Current indent:", currentIndent);
        const tr = state.tr.setNodeMarkup(outlineItemPos, undefined, { indent: Math.min(16, currentIndent + 1) });
        editor.view.dispatch(tr);
        return true;
      },
      "Shift-Tab": ({ editor }) => {
        console.log("Shift-Tab pressed in OutlineListItem");
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        let depth = $from.depth;
        let outlineItemPos = null;
        while (depth > 0) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            outlineItemPos = $from.before(depth);
            break;
          }
          depth--;
        }
        if (outlineItemPos === null) return false;
        const outlineItemNode = state.doc.nodeAt(outlineItemPos);
        if (!outlineItemNode) return false;
        const currentIndent = outlineItemNode.attrs.indent || 0;
        console.log("Current indent:", currentIndent);
        const tr = state.tr.setNodeMarkup(outlineItemPos, undefined, { indent: Math.max(0, currentIndent - 1) });
        editor.view.dispatch(tr);
        return true;
      }
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      console.log('Creating OutlineListItem view, indent:', node.attrs.indent);
      const isNested = node.lastChild?.type.name === OutlineList.name;

      const li = document.createElement("li");

      if (node.attrs.collapsed) li.classList.add("collapsed");
      else li.classList.remove("collapsed");

      if (isNested) li.classList.add("nested");
      else li.classList.remove("nested");

      li.style.marginLeft = `${node.attrs.indent * 20}px`;
      li.dataset.indent = node.attrs.indent.toString();

      li.addEventListener("click", (e: MouseEvent) => {
        if (typeof getPos === "function") {
          const target = e.target as HTMLElement;
          if (target.classList.contains("toggle-collapse")) {
            editor.commands.command(({ tr }) => {
              const pos = getPos();
              tr.setNodeMarkup(pos, undefined, {
                collapsed: !node.attrs.collapsed
              });
              return true;
            });
          }
        }
      });

      return {
        dom: li,
        contentDOM: li,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }
          const isNested = updatedNode.lastChild?.type.name === OutlineList.name;

          if (updatedNode.attrs.collapsed) li.classList.add("collapsed");
          else li.classList.remove("collapsed");

          if (isNested) li.classList.add("nested");
          else li.classList.remove("nested");

          li.style.marginLeft = `${updatedNode.attrs.indent * 20}px`;
          li.dataset.indent = updatedNode.attrs.indent.toString();

          return true;
        }
      };
    };
  }
});
