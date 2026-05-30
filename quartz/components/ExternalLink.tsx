import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

interface Options {
  title: string
  href: string
}

export default ((opts?: Partial<Options>) => {
  const title = opts?.title ?? "External"
  const href = opts?.href ?? "#"

  const ExternalLink: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
    return (
      <div class="external-link-wrapper">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          class="external-link"
          style="display:block;padding:8px 12px;margin:8px 0;border-radius:6px;
                 background:var(--secondary);color:white;text-decoration:none;
                 font-weight:600;font-size:0.9rem;text-align:center;"
        >
          {title}
        </a>
      </div>
    )
  }

  ExternalLink.css = `
    .external-link:hover {
      opacity: 0.85;
    }
  `

  return ExternalLink
}) satisfies QuartzComponentConstructor
