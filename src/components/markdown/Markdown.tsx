import type { ReactElement } from "react";
import { parseMarkdown, type Block, type InlineNode } from "@/components/markdown/parseMarkdown";

function Inline(props: { nodes: InlineNode[] }): ReactElement {
  return (
    <>
      {props.nodes.map((node, index) => {
        switch (node.kind) {
          case "strong":
            return (
              <strong key={index} className="font-semibold text-fg">
                {node.text}
              </strong>
            );
          case "em":
            return <em key={index}>{node.text}</em>;
          case "code":
            return (
              <code key={index} className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[0.85em]">
                {node.text}
              </code>
            );
          case "text":
            return <span key={index}>{node.text}</span>;
        }
      })}
    </>
  );
}

function BlockView(props: { block: Block }): ReactElement {
  const { block } = props;
  switch (block.kind) {
    case "heading": {
      if (block.level === 2) {
        return (
          <h3 className="mt-6 text-base font-semibold text-fg first:mt-0">
            <Inline nodes={block.inline} />
          </h3>
        );
      }
      if (block.level === 3) {
        return (
          <h4 className="mt-4 text-sm font-semibold text-fg first:mt-0">
            <Inline nodes={block.inline} />
          </h4>
        );
      }
      return (
        <h5 className="mt-3 text-sm font-medium text-fg first:mt-0">
          <Inline nodes={block.inline} />
        </h5>
      );
    }
    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index} className="pl-1">
          <Inline nodes={item} />
        </li>
      ));
      return block.ordered ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5">{items}</ol>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-subtle">{items}</ul>
      );
    }
    case "rule":
      return <hr className="my-4 border-line" />;
    case "paragraph":
      return (
        <p className="mt-2">
          <Inline nodes={block.inline} />
        </p>
      );
  }
}

/**
 * Renders untrusted model markdown as React elements; no HTML string is ever injected.
 * Headings start at h3 because a brief always sits inside a section that owns h2.
 */
export function Markdown(props: { source: string }): ReactElement {
  const blocks = parseMarkdown(props.source);
  return (
    <div className="text-sm leading-relaxed text-fg">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}
