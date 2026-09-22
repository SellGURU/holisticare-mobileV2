import { Fragment } from "react";

const BOLD_SEGMENT = /(\*\*.+?\*\*)/g;
const BOLD_WRAP = /^\*\*(.+?)\*\*$/;

type MarkdownBoldProps = {
  text: string;
};

export function MarkdownBold({ text }: MarkdownBoldProps) {
  const parts = String(text).split(BOLD_SEGMENT);

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(BOLD_WRAP);
        if (match) {
          return (
            <strong key={index} className="font-semibold">
              {match[1]}
            </strong>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
