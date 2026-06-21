import { useState } from 'react'
import MathView from './MathView'
import { LESSONS } from '../data/lessons'

interface LessonsProps {
  onLoad: (expr: string) => void
}

// The guided learning panel: ordered lessons, each able to load an example
// expression into the input via `onLoad`.
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
    </section>
  )
}
