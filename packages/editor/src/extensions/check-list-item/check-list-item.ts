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

export interface CheckListItemOptions {
  onReadOnlyChecked?: (node: ProseMirrorNode, checked: boolean) => boolean;
  nested: boolean;
  HTMLAttributes: Record<string, any>;
}

// export const inputRegex = /^\s*(\[([( |x])?\])\s$/;

export const CheckListItem = Node.create<CheckListItemOptions>({
  name: "checkListItem",

  addOptions() {
    return {
      nested: false,
      HTMLAttributes: {}
    };
  },

  content() {
    return this.options.nested ? "paragraph block*" : "paragraph+";
  },

  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.classList.contains("checked"),
        renderHTML: (attributes) => ({
          class: attributes.checked ? "checked" : ""
        })
      },
      indent: {
        default: 0,
        parseHTML: (element) => parseInt(element.dataset.indent || "0", 10) || 0
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: `li.simple-checklist--item`,
        priority: 51
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "simple-checklist--item"
      }),
      0
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      Tab: ({ editor }) => {
        console.log("Tab pressed in CheckListItem");
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        let depth = $from.depth;
        let checkItemPos = null;
        while (depth > 0) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            checkItemPos = $from.before(depth);
            break;
          }
          depth--;
        }
        if (checkItemPos === null) return false;
        const checkItemNode = state.doc.nodeAt(checkItemPos);
        if (!checkItemNode) return false;
        const currentIndent = checkItemNode.attrs.indent || 0;
        console.log("Current indent:", currentIndent);
        const tr = state.tr.setNodeMarkup(checkItemPos, undefined, { indent: Math.min(16, currentIndent + 1) });
        editor.view.dispatch(tr);
        return true;
      },
      "Shift-Tab": ({ editor }) => {
        console.log("Shift-Tab pressed in CheckListItem");
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        let depth = $from.depth;
        let checkItemPos = null;
        while (depth > 0) {
          const node = $from.node(depth);
          if (node.type.name === this.name) {
            checkItemPos = $from.before(depth);
            break;
          }
          depth--;
        }
        if (checkItemPos === null) return false;
        const checkItemNode = state.doc.nodeAt(checkItemPos);
        if (!checkItemNode) return false;
        const currentIndent = checkItemNode.attrs.indent || 0;
        console.log("Current indent:", currentIndent);
        const tr = state.tr.setNodeMarkup(checkItemPos, undefined, { indent: Math.max(0, currentIndent - 1) });
        editor.view.dispatch(tr);
        return true;
      }
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      console.log('Creating CheckListItem view, indent:', node.attrs.indent);
      const listItem = document.createElement("li");
      const checkboxWrapper = document.createElement("label");
      const checkboxStyler = document.createElement("span");
      const checkbox = document.createElement("input");
      const content = document.createElement("div");

      checkboxWrapper.contentEditable = "false";
      checkbox.type = "checkbox";

      checkbox.addEventListener("mousedown", (event) => {
        if (globalThis.keyboardShown) {
          event.preventDefault();
        }
      });

      checkbox.addEventListener("change", (e) => {
        if (typeof getPos === "function") {
          const target = e.target as HTMLInputElement;
          editor.commands.command(({ tr }) => {
            const pos = getPos();
            tr.setNodeMarkup(pos, undefined, {
              checked: target.checked
            });
            return true;
          });
        }
      });

      if (node.attrs.checked) {
        checkbox.setAttribute("checked", "checked");
      }

      checkboxWrapper.append(checkbox, checkboxStyler);
      listItem.append(checkboxWrapper, content);

      listItem.style.marginLeft = `${node.attrs.indent * 20}px`;
      listItem.dataset.indent = node.attrs.indent.toString();

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }

          listItem.dataset.checked = updatedNode.attrs.checked;
          if (updatedNode.attrs.checked) {
            checkbox.setAttribute("checked", "checked");
          } else {
            checkbox.removeAttribute("checked");
          }

          // Update indentation
          listItem.style.marginLeft = `${updatedNode.attrs.indent * 20}px`;
          listItem.dataset.indent = updatedNode.attrs.indent.toString();

          return true;
        }
      };
    };
  }

  // addInputRules() {
  //   return [
  //     wrappingInputRule({
  //       find: inputRegex,
  //       type: this.type,
  //       getAttributes: (match) => ({
  //         checked: match[match.length - 1] === "x"
  //       })
  //     })
  //   ];
  // }
});
