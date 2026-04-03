import { codeToHtml } from 'shiki';

interface CodeBlockProps {
  code: string;
  lang?: string;
  theme?: string;
}

export default async function CodeBlock({
  code,
  lang = 'javascript',
  theme = 'github-light',
}: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme,
  });

  return (
    <div
      className="overflow-x-auto rounded-lg bg-[#fafafa] text-sm [&_pre]:!bg-[#fafafa] [&_pre]:p-4 [&_code]:font-mono"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
