export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number // página actual (0-based, coincide con Spring)
  size: number
}
