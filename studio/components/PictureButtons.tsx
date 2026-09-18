import {useCallback} from 'react'
import {set, unset, type StringInputProps} from 'sanity'

// St. God's Memorial Hospital input: one giant picture per option, no typing.
// Options come from the field's `options.list`, each carrying a `picture` (emoji or /static image path).
export type PictureOption = {title: string; value: string; picture: string}

const isImage = (picture: string) => picture.startsWith('/')

export function PictureButtons(props: StringInputProps) {
  const {value, onChange, readOnly, schemaType, elementProps} = props
  const list = ((schemaType.options?.list ?? []) as unknown as PictureOption[]).filter((o) => o.picture)

  const choose = useCallback(
    (next: string) => onChange(next === value ? unset() : set(next)),
    [onChange, value],
  )

  return (
    <div
      role="radiogroup"
      aria-labelledby={elementProps.id}
      style={{display: 'grid', gridTemplateColumns: `repeat(${Math.min(list.length, 4)}, 1fr)`, gap: 16}}
    >
      {list.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.title}
            disabled={readOnly}
            onClick={() => choose(option.value)}
            style={{
              aspectRatio: '1',
              fontSize: 96,
              lineHeight: 1,
              borderRadius: 24,
              border: selected ? '8px solid #2e7d32' : '4px solid #9e9e9e',
              background: selected ? '#e8f5e9' : 'transparent',
              cursor: readOnly ? 'not-allowed' : 'pointer',
              opacity: readOnly && !selected ? 0.35 : 1,
              padding: 8,
            }}
          >
            {isImage(option.picture) ? (
              <img src={option.picture} alt="" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
            ) : (
              option.picture
            )}
          </button>
        )
      })}
    </div>
  )
}
