"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`markdown-content text-sm leading-relaxed text-slate-200 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-4 mb-2 text-base font-bold text-slate-100 border-b border-slate-800 pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3.5 mb-2 text-sm font-semibold text-slate-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2.5 ml-4 list-disc space-y-1 text-slate-300 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2.5 ml-4 list-decimal space-y-1 text-slate-300 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-300">{children}</em>
          ),
          hr: () => <hr className="my-3 border-slate-800" />,
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 border-l-2 border-emerald-400/60 bg-emerald-400/5 px-3 py-1 text-slate-300 italic">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre className="my-2.5 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-200 border border-slate-800 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-slate-200">
              {children}
            </pre>
          ),
          code: ({ children, ...props }) => (
            <code
              className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-xs text-emerald-300"
              {...props}
            >
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-800/60 text-slate-200 border-b border-slate-700">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-800/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-slate-200">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-300 align-top">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
