(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/calendar.ts — slots root/header/body/heading/headingLabel/
  // grid/gridRow/gridWeekDaysRow/gridBody/headCell/headCellWeek/cell/
  // cellTrigger/cellWeek + color/variant/size/view/weekNumbers + compounds.
  // Views month/year e weekNumbers no tema para safelist; controller só
  // ativa view:day (plano Calendar / §7).
  // Tailwind v3: tokens --ui-*; opacidades /N → color-mix; outline-3 →
  // outline-[3px]; data-selected: → data-[is-selected]: (não data-[selected]:
  // — AngularJS BOOLEAN_ATTR engole ng-attr-data-selected em <button>, §5.10);
  // not-data-selected: → [&:not([data-is-selected])]:; text-md → text-base.
  // Idem data-disabled → data-is-disabled.
  angular.module('gravityElements.element').constant('geCalendarTheme', {
    slots: {
      root: '',
      header: 'flex items-center justify-between',
      body: 'flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0',
      heading: 'flex-1 min-w-0 text-center',
      headingLabel: 'font-medium block truncate p-1.5',
      grid: 'w-full border-collapse select-none space-y-1 focus:outline-none',
      gridRow: 'grid',
      gridWeekDaysRow: 'mb-1 grid w-full grid-cols-7',
      gridBody: 'grid',
      headCell: 'rounded-md',
      headCellWeek: 'rounded-md text-[var(--ui-text-muted)]',
      cell: 'relative text-center',
      cellTrigger:
        'm-0.5 relative flex items-center justify-center whitespace-nowrap focus-visible:outline-[3px] data-[is-disabled]:text-[var(--ui-text-muted)] data-[unavailable]:line-through data-[unavailable]:text-[var(--ui-text-muted)] data-[unavailable]:pointer-events-none data-[today]:font-semibold transition',
      cellWeek: 'relative text-center text-[var(--ui-text-muted)]',
    },
    variants: {
      color: {
        primary: {
          headCell: 'text-[var(--ui-primary)]',
          cellTrigger:
            'outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)]',
        },
        secondary: {
          headCell: 'text-[var(--ui-secondary)]',
          cellTrigger:
            'outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)]',
        },
        success: {
          headCell: 'text-[var(--ui-success)]',
          cellTrigger:
            'outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)]',
        },
        info: {
          headCell: 'text-[var(--ui-info)]',
          cellTrigger:
            'outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)]',
        },
        warning: {
          headCell: 'text-[var(--ui-warning)]',
          cellTrigger:
            'outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)]',
        },
        error: {
          headCell: 'text-[var(--ui-error)]',
          cellTrigger:
            'outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)]',
        },
        neutral: {
          headCell: 'text-[var(--ui-text-highlighted)]',
          cellTrigger:
            'outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)]',
        },
      },
      variant: {
        solid: '',
        outline: '',
        soft: '',
        subtle: '',
      },
      size: {
        xs: {
          headingLabel: 'text-xs',
          cell: 'text-xs',
          cellWeek: 'text-xs',
          headCell: 'text-[10px]',
          headCellWeek: 'text-[10px]',
          body: 'space-y-2 pt-2',
        },
        sm: {
          headingLabel: 'text-xs',
          headCell: 'text-xs',
          headCellWeek: 'text-xs',
          cellWeek: 'text-xs',
          cell: 'text-xs',
        },
        md: {
          headingLabel: 'text-sm',
          headCell: 'text-xs',
          headCellWeek: 'text-xs',
          cellWeek: 'text-xs',
          cell: 'text-sm',
        },
        lg: {
          headingLabel: 'text-base',
          headCell: 'text-base',
          headCellWeek: 'text-base',
        },
        xl: {
          headingLabel: 'text-lg',
          headCell: 'text-lg',
          headCellWeek: 'text-lg',
        },
      },
      view: {
        day: {
          gridRow: 'grid-cols-7 place-items-center',
          cellTrigger: 'rounded-full data-[outside-view]:text-[var(--ui-text-muted)]',
        },
        month: {
          gridRow: 'grid-cols-4',
          cellTrigger: 'rounded-md',
        },
        year: {
          gridRow: 'grid-cols-4',
          cellTrigger: 'rounded-md',
        },
      },
      weekNumbers: {
        true: '',
      },
    },
    compoundVariants: [
      {
        color: 'primary',
        variant: 'solid',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-primary)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-primary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)]',
        },
      },
      {
        color: 'secondary',
        variant: 'solid',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-secondary)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-secondary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)]',
        },
      },
      {
        color: 'success',
        variant: 'solid',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-success)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-success)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)]',
        },
      },
      {
        color: 'info',
        variant: 'solid',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-info)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-info)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)]',
        },
      },
      {
        color: 'warning',
        variant: 'solid',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-warning)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-warning)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)]',
        },
      },
      {
        color: 'error',
        variant: 'solid',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-error)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)]',
        },
      },
      {
        color: 'primary',
        variant: 'outline',
        class: {
          cellTrigger:
            'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-primary)_50%,transparent)] data-[is-selected]:text-[var(--ui-primary)] data-[is-selected]:focus-visible:ring-[var(--ui-primary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-primary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)]',
        },
      },
      {
        color: 'secondary',
        variant: 'outline',
        class: {
          cellTrigger:
            'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-secondary)_50%,transparent)] data-[is-selected]:text-[var(--ui-secondary)] data-[is-selected]:focus-visible:ring-[var(--ui-secondary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-secondary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)]',
        },
      },
      {
        color: 'success',
        variant: 'outline',
        class: {
          cellTrigger:
            'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-success)_50%,transparent)] data-[is-selected]:text-[var(--ui-success)] data-[is-selected]:focus-visible:ring-[var(--ui-success)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-success)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)]',
        },
      },
      {
        color: 'info',
        variant: 'outline',
        class: {
          cellTrigger:
            'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-info)_50%,transparent)] data-[is-selected]:text-[var(--ui-info)] data-[is-selected]:focus-visible:ring-[var(--ui-info)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-info)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)]',
        },
      },
      {
        color: 'warning',
        variant: 'outline',
        class: {
          cellTrigger:
            'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-warning)_50%,transparent)] data-[is-selected]:text-[var(--ui-warning)] data-[is-selected]:focus-visible:ring-[var(--ui-warning)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-warning)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)]',
        },
      },
      {
        color: 'error',
        variant: 'outline',
        class: {
          cellTrigger:
            'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-error)_50%,transparent)] data-[is-selected]:text-[var(--ui-error)] data-[is-selected]:focus-visible:ring-[var(--ui-error)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)]',
        },
      },
      {
        color: 'primary',
        variant: 'soft',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] data-[is-selected]:text-[var(--ui-primary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-primary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)]',
        },
      },
      {
        color: 'secondary',
        variant: 'soft',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] data-[is-selected]:text-[var(--ui-secondary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-secondary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)]',
        },
      },
      {
        color: 'success',
        variant: 'soft',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] data-[is-selected]:text-[var(--ui-success)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-success)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)]',
        },
      },
      {
        color: 'info',
        variant: 'soft',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] data-[is-selected]:text-[var(--ui-info)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-info)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)]',
        },
      },
      {
        color: 'warning',
        variant: 'soft',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] data-[is-selected]:text-[var(--ui-warning)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-warning)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)]',
        },
      },
      {
        color: 'error',
        variant: 'soft',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] data-[is-selected]:text-[var(--ui-error)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)]',
        },
      },
      {
        color: 'primary',
        variant: 'subtle',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] data-[is-selected]:text-[var(--ui-primary)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-primary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-primary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)]',
        },
      },
      {
        color: 'secondary',
        variant: 'subtle',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] data-[is-selected]:text-[var(--ui-secondary)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-secondary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-secondary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)]',
        },
      },
      {
        color: 'success',
        variant: 'subtle',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] data-[is-selected]:text-[var(--ui-success)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-success)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-success)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)]',
        },
      },
      {
        color: 'info',
        variant: 'subtle',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] data-[is-selected]:text-[var(--ui-info)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-info)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-info)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)]',
        },
      },
      {
        color: 'warning',
        variant: 'subtle',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] data-[is-selected]:text-[var(--ui-warning)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-warning)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-warning)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)]',
        },
      },
      {
        color: 'error',
        variant: 'subtle',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] data-[is-selected]:text-[var(--ui-error)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-error)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)]',
        },
      },
      {
        color: 'neutral',
        variant: 'solid',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-bg-inverted)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-text-highlighted)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)]',
        },
      },
      {
        color: 'neutral',
        variant: 'outline',
        class: {
          cellTrigger:
            'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[var(--ui-border-accented)] data-[is-selected]:text-[var(--ui-text)] data-[is-selected]:bg-[var(--ui-bg)] data-[is-selected]:focus-visible:ring-[var(--ui-bg-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-text-highlighted)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)]',
        },
      },
      {
        color: 'neutral',
        variant: 'soft',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-bg-elevated)] data-[is-selected]:text-[var(--ui-text)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-text-highlighted)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)]',
        },
      },
      {
        color: 'neutral',
        variant: 'subtle',
        class: {
          cellTrigger:
            'data-[is-selected]:bg-[var(--ui-bg-elevated)] data-[is-selected]:text-[var(--ui-text)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[var(--ui-border-accented)] data-[is-selected]:focus-visible:ring-[var(--ui-bg-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-text-highlighted)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)]',
        },
      },
      {
        size: 'xs',
        view: 'day',
        class: { cellTrigger: 'size-7' },
      },
      {
        size: 'sm',
        view: 'day',
        class: { cellTrigger: 'size-7' },
      },
      {
        size: 'md',
        view: 'day',
        class: { cellTrigger: 'size-8' },
      },
      {
        size: 'lg',
        view: 'day',
        class: { cellTrigger: 'size-9 text-base' },
      },
      {
        size: 'xl',
        view: 'day',
        class: { cellTrigger: 'size-10 text-lg' },
      },
      {
        size: 'xs',
        view: 'month',
        class: { cellTrigger: 'h-7 px-2' },
      },
      {
        size: 'sm',
        view: 'month',
        class: { cellTrigger: 'h-7 px-2' },
      },
      {
        size: 'md',
        view: 'month',
        class: { cellTrigger: 'h-8 px-3' },
      },
      {
        size: 'lg',
        view: 'month',
        class: { cellTrigger: 'h-9 px-4 text-base' },
      },
      {
        size: 'xl',
        view: 'month',
        class: { cellTrigger: 'h-10 px-5 text-lg' },
      },
      {
        size: 'xs',
        view: 'year',
        class: { cellTrigger: 'h-7 px-2' },
      },
      {
        size: 'sm',
        view: 'year',
        class: { cellTrigger: 'h-7 px-2' },
      },
      {
        size: 'md',
        view: 'year',
        class: { cellTrigger: 'h-8 px-3' },
      },
      {
        size: 'lg',
        view: 'year',
        class: { cellTrigger: 'h-9 px-4 text-base' },
      },
      {
        size: 'xl',
        view: 'year',
        class: { cellTrigger: 'h-10 px-5 text-lg' },
      },
      {
        view: 'day',
        weekNumbers: true,
        class: {
          gridRow: 'grid-cols-8',
          gridWeekDaysRow: 'grid-cols-8 [&>*:first-child]:col-start-2',
        },
      },
    ],
    defaultVariants: {
      size: 'md',
      color: 'primary',
      variant: 'solid',
      view: 'day',
    },
  });
})();
