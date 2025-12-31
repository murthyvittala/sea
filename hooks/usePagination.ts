import { useState, useCallback } from 'react'

interface UsePaginationProps {
  initialPage?: number
  pageSize?: number
  totalItems?: number
}

export function usePagination({
  initialPage = 1,
  pageSize = 100,
  totalItems = 0,
}: UsePaginationProps = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = Math.ceil(totalItems / pageSize)

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const reset = useCallback(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  return {
    currentPage,
    totalPages,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    reset,
  }
}
