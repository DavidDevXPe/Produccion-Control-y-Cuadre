export interface CaptureTableHeaderProps {
  readonly isFreezing: boolean
}

export function CaptureTableHeader({ isFreezing }: CaptureTableHeaderProps) {
  return (
    <>
      <colgroup>
        <col className="w-[28%] min-w-[15rem]" />
        <col className="w-[11.5%] min-w-[8.75rem]" />
        <col className="w-[11.5%] min-w-[8.75rem]" />
        <col className="w-[10%] min-w-[7rem]" />
        <col className="w-[9.5%] min-w-[6.5rem]" />
        <col className="w-[8%] min-w-[6rem]" />
        <col className="w-[9.5%] min-w-[6.5rem]" />
        <col className="w-[12%] min-w-[8.5rem]" />
        <col className="w-[3rem] min-w-[3rem]" />
      </colgroup>
      <caption className="sr-only">Ingreso de producción por producto</caption>
      <thead>
        <tr className="border-b-2 border-slate-300 bg-slate-100 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-800 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-canvas dark:text-ui-text-dark-subtle">
          <th className="sticky left-0 z-20 border-r border-slate-300 bg-slate-100 px-4 py-2.5 text-left dark:border-r-ui-line-navy dark:bg-ui-surface-dark-canvas dark:text-ui-text-dark-subtle">
            Familia / producto
          </th>
          <th className="px-2 py-2.5 text-right leading-tight">Día reportado</th>
          <th className="px-2 py-2.5 text-right leading-tight">Noche reportado</th>
          <th className="px-3 py-2.5 text-right leading-tight">Total jornada</th>
          <th className="px-2.5 py-2.5 text-right leading-tight">
            {isFreezing ? 'Disponible' : 'Rend. preliminar'}
          </th>
          <th className="px-2.5 py-2.5 text-right leading-tight">
            {isFreezing ? 'Vinculado' : 'Objetivo'}
          </th>
          <th className="px-2.5 py-2.5 text-right leading-tight">
            {isFreezing ? 'Por vincular' : 'Kg faltantes'}
          </th>
          <th className="whitespace-nowrap px-3 py-2.5 text-center">Estado</th>
          <th className="w-12 px-2 py-2.5 text-center">
            <span className="sr-only">Eliminar</span>
          </th>
        </tr>
      </thead>
    </>
  )
}
