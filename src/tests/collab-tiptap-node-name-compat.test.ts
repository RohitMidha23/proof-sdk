import * as Y from 'yjs';
import { createDocument } from '../../server/db.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function addEmptyListFragment(doc: Y.Doc, listName: string, itemName: string): void {
  const fragment = doc.getXmlFragment('prosemirror');
  const list = new Y.XmlElement(listName);
  const item = new Y.XmlElement(itemName);
  const paragraph = new Y.XmlElement('paragraph');
  item.insert(0, [paragraph]);
  list.insert(0, [item]);
  fragment.insert(0, [list]);
}

function addTextListFragment(doc: Y.Doc, listName: string, itemName: string, text: string): void {
  const fragment = doc.getXmlFragment('prosemirror');
  const list = new Y.XmlElement(listName);
  const item = new Y.XmlElement(itemName);
  const paragraph = new Y.XmlElement('paragraph');
  const textNode = new Y.XmlText();
  textNode.insert(0, text);
  paragraph.insert(0, [textNode]);
  item.insert(0, [paragraph]);
  list.insert(0, [item]);
  fragment.insert(0, [list]);
}

async function run(): Promise<void> {
  const collab = await import('../../server/collab.ts');
  const originalWarn = console.warn;
  const originalError = console.error;
  const suppressYjsDetachedWarning = (args: unknown[]): boolean =>
    args.length > 0 && args[0] === 'Invalid access: Add Yjs type to a document before reading data.';

  console.warn = (...args: unknown[]) => {
    if (suppressYjsDetachedWarning(args)) return;
    originalWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    if (suppressYjsDetachedWarning(args)) return;
    originalError(...args);
  };

  try {
    const orderedSlug = `tiptap-camel-ordered-${Math.random().toString(36).slice(2, 10)}`;
    createDocument(orderedSlug, '# ordered', {}, 'tiptap node-name compatibility');
    const orderedDoc = new Y.Doc();
    addEmptyListFragment(orderedDoc, 'orderedList', 'listItem');
    collab.__unsafePrimeLoadedDocForTests(orderedSlug, orderedDoc);
    const orderedMarkdown = await collab.getLoadedCollabMarkdownFromFragment(orderedSlug);
    assert(
      orderedMarkdown === '1.\n',
      `Expected ordered list markdown to survive Tiptap node names. markdown=${String(orderedMarkdown)}`,
    );

    const textSlug = `tiptap-camel-text-${Math.random().toString(36).slice(2, 10)}`;
    createDocument(textSlug, '# text', {}, 'tiptap node-name compatibility');
    const textDoc = new Y.Doc();
    addTextListFragment(textDoc, 'orderedList', 'listItem', 'alpha');
    collab.__unsafePrimeLoadedDocForTests(textSlug, textDoc);
    const textMarkdown = await collab.getLoadedCollabMarkdownFromFragment(textSlug);
    assert(
      textMarkdown === '1. alpha\n',
      `Expected ordered list text to survive Tiptap node names. markdown=${String(textMarkdown)}`,
    );
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }

  console.log('✓ collab fragment projection supports Tiptap camelCase node names');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
