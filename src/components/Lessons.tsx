import { useState } from 'react'
import MathView from './MathView'
import { LESSONS } from '../data/lessons'
import type { Lesson, LessonSection } from '../data/lessons'

interface LessonsProps {
  onLoad: (expr: string) => void
  onSelectMode: (typed: boolean) => void
}

const SECTIONS: { id: LessonSection; title: string; desc: string }[] = [
  {
    id: 'untyped',
    title: 'Untyped lambda calculus',
    desc: 'Variables, functions, application, and the reduction rules — the classic calculus.',
  },
  {
    id: 'typed',
    title: 'Typed lambda calculus',
    desc: 'Add a type discipline: every term gets a simple type, ruling out the paradoxical ones.',
  },
]

// The guided learning panel. Lessons are grouped into an Untyped and a Typed
// section (both always shown). A "try" button loads its expression and switches
// the app into the matching mode, so typed examples display their type.
export default function Lessons({ onLoad, onSelectMode }: LessonsProps) {
  const [openId, setOpenId] = useState<string>(LESSONS[0].id)

  const tryExpr = (lesson: Lesson, expr: string) => {
    onSelectMode(lesson.section === 'typed')
    onLoad(expr)
  }

  return (
    <section className="lessons">
      <h2>Learn</h2>

      {SECTIONS.map((section) => {
        const lessons = LESSONS.filter((l) => l.section === section.id)
        return (
          <div key={section.id} className="lesson-section">
            <h3>{section.title}</h3>
            <p className="lesson-section-desc">{section.desc}</p>

            <div className="lesson-list">
              {lessons.map((lesson, i) => {
                const open = lesson.id === openId
                return (
                  <article key={lesson.id} className={`lesson ${open ? 'open' : ''}`}>
                    <button
                      className="lesson-title"
                      onClick={() => setOpenId(open ? '' : lesson.id)}
                      aria-expanded={open}
                    >
                      {i + 1}. {lesson.title}
                    </button>
                    {open && (
                      <div className="lesson-body">
                        {lesson.blocks.map((block, j) => {
                          if (block.kind === 'p') return <p key={j}>{block.text}</p>
                          if (block.kind === 'math')
                            return <MathView key={j} latex={block.latex} display className="lesson-math" />
                          return (
                            <button
                              key={j}
                              className="try-btn"
                              onClick={() => tryExpr(lesson, block.expr)}
                            >
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
          </div>
        )
      })}
    </section>
  )
}
