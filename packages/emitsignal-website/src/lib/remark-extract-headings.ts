import { parse } from 'acorn';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';

interface MdxEsmNode {
    data: { estree: ReturnType<typeof parse> };
    type: 'mdxjsEsm';
    value: string;
}

// Extracts all h2 headings and injects them as `export const headings = [...]`
export function remarkExtractHeadings() {
    return (tree: Parameters<typeof visit>[0]) => {
        const headings: Array<{ id: string; text: string }> = [];

        visit(tree, 'heading', (node: { depth: number }) => {
            if (node.depth !== 2) {
                return;
            }
            const text = toString(node);
            const id = text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            headings.push({ id, text });
        });

        const code = `export const headings = ${JSON.stringify(headings)};`;
        const estree = parse(code, { ecmaVersion: 2020, sourceType: 'module' });

        const node: MdxEsmNode = { data: { estree }, type: 'mdxjsEsm', value: code };
        (tree as unknown as { children: unknown[] }).children.unshift(node);
    };
}
