import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { slugify } from '@/lib/blog';

import { CodeCopyButton } from './CodeCopyButton';

function getNodeText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (
    React.isValidElement(node) &&
    node.props &&
    typeof node.props === 'object'
  ) {
    return getNodeText((node.props as { children?: React.ReactNode }).children);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }
  return '';
}

export const BlogComponents = {
  // Override default image component
  img: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => (
    <span className="my-6 block overflow-hidden rounded-lg border">
      <Image
        src={src}
        alt={alt || ''}
        width={800}
        height={450}
        className="w-full object-cover"
        {...props}
      />
    </span>
  ),

  // Custom headings with anchor IDs for Table of Contents
  h1: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <h1
      className="mt-8 mb-4 text-3xl font-bold tracking-tight lg:text-4xl"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const text = getNodeText(children);
    const id = slugify(text);
    return (
      <h2
        id={id}
        className="group mt-10 mb-4 flex scroll-mt-24 items-center gap-2 text-2xl font-semibold tracking-tight"
        {...props}
      >
        <span>{children}</span>
        {id && (
          <a
            href={`#${id}`}
            aria-label={`Link to ${text}`}
            className="text-muted-foreground hover:text-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </a>
        )}
      </h2>
    );
  },
  h3: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const text = getNodeText(children);
    const id = slugify(text);
    return (
      <h3
        id={id}
        className="group mt-8 mb-3 flex scroll-mt-24 items-center gap-2 text-xl font-medium tracking-tight"
        {...props}
      >
        <span>{children}</span>
        {id && (
          <a
            href={`#${id}`}
            aria-label={`Link to ${text}`}
            className="text-muted-foreground hover:text-foreground text-sm opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </a>
        )}
      </h3>
    );
  },

  // Custom paragraph styling
  p: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <p className="text-foreground/90 my-4 text-base leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Links
  a: ({
    href,
    children,
    ...props
  }: {
    href?: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const isInternal = href && (href.startsWith('/') || href.startsWith('#'));
    if (isInternal) {
      return (
        <Link
          href={href || '#'}
          className="text-primary font-medium underline underline-offset-4 transition-opacity hover:opacity-80"
          {...props}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary font-medium underline underline-offset-4 transition-opacity hover:opacity-80"
        {...props}
      >
        {children}
      </a>
    );
  },

  // Lists
  ul: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <ul className="text-foreground/90 my-4 ml-6 list-disc space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <ol
      className="text-foreground/90 my-4 ml-6 list-decimal space-y-2"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Tables
  table: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div className="my-6 w-full overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <thead
      className="bg-muted/50 text-foreground border-b font-medium"
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <tbody className="text-foreground/90 divide-y" {...props}>
      {children}
    </tbody>
  ),
  tr: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <th className="text-foreground px-4 py-3 font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <td className="px-4 py-3 align-top" {...props}>
      {children}
    </td>
  ),

  // Code & Pre
  pre: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const codeText = getNodeText(children);

    return (
      <div className="group relative my-6">
        <pre
          className="bg-muted/40 overflow-x-auto rounded-xl border p-4 font-mono text-sm leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
          {...props}
        >
          {children}
        </pre>
        <CodeCopyButton code={codeText} />
      </div>
    );
  },
  code: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => {
    if (className?.includes('language-')) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm font-medium"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Blockquote
  blockquote: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <blockquote
      className="border-primary bg-muted/20 text-muted-foreground my-6 rounded-r border-l-4 py-2 pl-4 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Horizontal Rule
  hr: () => <hr className="border-border my-8" />,
};
