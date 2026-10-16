/** Shared look for text-like controls. 16px on touch avoids iOS zoom; 14px on desktop. */
export const inputClass =
  'h-10 w-full min-w-0 rounded-md border border-border-strong/70 bg-surface px-3 text-base text-fg ' +
  'placeholder:text-fg-muted/80 sm:text-sm touch:h-11 touch:text-base ' +
  'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring ' +
  'aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-fg-muted'
