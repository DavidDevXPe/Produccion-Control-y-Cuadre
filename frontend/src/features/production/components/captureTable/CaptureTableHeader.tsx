export interface CaptureTableHeaderProps {
  readonly isFreezing: boolean
}

export function CaptureTableHeader({ isFreezing }: CaptureTableHeaderProps) {
  return (
    <>
      <colgroup>
        <col className="w-[26%] min-w-[14rem]" />
        <col className="w-[11%] min-w-[8rem]" />
        <col className="w-[11%] min-w-[8rem]" />
        <col className="w-[10%] min-w-[7rem]" />
        <col className="w-[9.5%] min-w-[6.5rem]" />
        <col className="w-[8.5%] min-w-[6rem]" />
        <col className="w-[9.5%] min-w-[6.5rem]" />
        <col className="w-[10.5%] min-w-[7.5rem]" />
        <col className="w-[4%] min-w-[3.5rem]" />
      </colgroup>
      <caption className="sr-only">Ingreso de producción por producto</caption>
      <thead>
        <tr className="border-b-2 border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-200 dark:bg-slate-50/50 dark:text-slate-400">
          <th scope="col" className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 px-4 py-2.5 text-left dark:border-r-slate-200 dark:bg-slate-50 dark:text-slate-300">
            Familia / producto
          </th>
          <th scope="col" className="px-2 py-2.5 text-right leading-tight">Día reportado</th>
          <th scope="col" className="px-2 py-2.5 text-right leading-tight">Noche reportado</th>
          <th scope="col" className="px-3 py-2.5 text-right leading-tight">Total jornada</th>
          <th scope="col" className="px-2.5 py-2.5 text-right leading-tight">
            {isFreezing ? 'Disponible' : 'Rend. preliminar'}
          </th>
          <th scope="col" className="px-2.5 py-2.5 text-right leading-tight">
            {isFreezing ? 'Vinculado' : 'Objetivo'}
          </th>
          <th scope="col" className="px-2.5 py-2.5 text-right leading-tight">
            {isFreezing ? 'Por vincular' : 'Kg faltantes'}
          </th>
          <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-center">Estado</th>
          <th scope="col" className="w-12 px-2 py-2.5 text-center align-middle">
            Acción
          </th>
        </tr>
      </thead>
    </>
  )
}
