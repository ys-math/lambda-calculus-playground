import { useState } from 'react'
import MathView from './MathView'
import { LESSONS } from '../data/lessons'
import { EXAMPLE_GROUPS } from '../data/examples'

interface LessonsProps {
  onLoad: (expr: string) => void
}

// The learning panel: guided lessons plus a gallery of classic example terms.
// Both can push an expression into the playground via `onLoad`.
export default function Lessons({ onLoad }: LessonsProps) {
  const [openId, setOpenId] = useState<string>(LESSONS[0].id)

  return (
    <section className="lessons">
      <h2>Learn</h2>

      <div className="lesson-list">
        {LESSONS.map((lesson) => {
          const open = lesson.id === openId
          return (
            <article key={lesson.id} className={`lesson ${open ? 'open' : ''}`}>
              <button
                className="lesson-title"
                onClick={() => setOpenId(open ? '' : lesson.id)}
                aria-expanded={open}
              >
                {lesson.title}
              </button>
              {open && (
                <div className="lesson-body">
                  {lesson.blocks.map((block, i) => {
                    if (block.kind === 'p') return <p key={i}>{block.text}</p>
                    if (block.kind === 'math')
                      return <MathView key={i} latex={block.latex} display className="lesson-math" />
                    return (
                      <button key={i} className="try-btn" onClick={() => onLoad(block.expr)}>
                        ▶ {block.caption}
                      </button>
                    )
                  })}
                </div>
              )}
            </article>
          )
        })}
      </div>

      <h2>Examples</h2>
      <div className="example-groups">
        {EXAMPLE_GROUPS.map((group) => (
          <div key={group.title} className="example-group">
            <h3>{group.title}</h3>
            <ul>
              {group.examples.map((ex) => (
                <li key={ex.label}>
                  <button className="example-btn" onClick={() => onLoad(ex.expr)} title={ex.note}>
                    {ex.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
