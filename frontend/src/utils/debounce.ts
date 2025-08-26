/**
 * Creates a debounced function that delays invoking the provided function until after
 * the specified wait time has elapsed since the last time the debounced function was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A new debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = undefined
    }, wait)
  }
}

/**
 * Creates a debounced function with immediate execution option
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param immediate Execute function immediately on the leading edge
 * @returns A new debounced function with cancel method
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): {
  (...args: Parameters<T>): void
  cancel: () => void
} {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined

  const debounced = function(...args: Parameters<T>) {
    lastArgs = args
    
    const callNow = immediate && !timeoutId
    
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = undefined
      if (!immediate && lastArgs) {
        func(...lastArgs)
      }
    }, wait)

    if (callNow) {
      func(...args)
    }
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  return debounced
}