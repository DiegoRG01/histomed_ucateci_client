import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  action?: ReactNode
}

function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      {action}
    </div>
  )
}

export { PageHeader }
export type { PageHeaderProps }
