import { Fragment } from 'react'

/** "Web · Android · iOS · Desktop" that wraps between items, never right before a "·". */
export default function Dotted({ text, className = 'nowrap' }: { text: string; className?: string }) {
  const parts = text.split(' · ')
  if (parts.length === 1) return <>{text}</> // plain text wraps normally
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={part}>
          <span className={className}>{i < parts.length - 1 ? `${part} ·` : part}</span>
          {i < parts.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  )
}
