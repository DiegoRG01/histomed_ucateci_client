import { buttonVariants } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

type PaginationBarProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function PaginationBar({ page, totalPages, onPageChange }: PaginationBarProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i)
      return pages
    }

    pages.push(0)

    if (page > 2) pages.push("ellipsis")

    const start = Math.max(1, page - 1)
    const end = Math.min(totalPages - 2, page + 1)

    for (let i = start; i <= end; i++) pages.push(i)

    if (page < totalPages - 3) pages.push("ellipsis")

    pages.push(totalPages - 1)

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className={cn(
              buttonVariants({ variant: "ghost", size: "default" }),
              "gap-1 px-2.5 sm:pl-2.5"
            )}
          >
            ← Anterior
          </button>
        </PaginationItem>

        {visiblePages.map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <button
                onClick={() => onPageChange(p)}
                className={cn(
                  buttonVariants({
                    variant: page === p ? "outline" : "ghost",
                    size: "icon",
                  })
                )}
                aria-current={page === p ? "page" : undefined}
              >
                {p + 1}
              </button>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className={cn(
              buttonVariants({ variant: "ghost", size: "default" }),
              "gap-1 px-2.5 sm:pr-2.5"
            )}
          >
            Siguiente →
          </button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export { PaginationBar }
export type { PaginationBarProps }
