import type { ProductionProcess } from '../../model/types'

export interface CaptureTableHeaderProps {
  readonly isFreezing?: boolean
  readonly process?: ProductionProcess
}

export function CaptureTableHeader({ isFreezing, process }: CaptureTableHeaderProps) {
  const currentProcess = process ?? (isFreezing ? 'FREEZING' : 'PACKING')
  const isDownstream = currentProcess !== 'PACKING'

  const previousLabel =
    currentProcess === 'FREEZING'
      ? 'Envasado'
      : currentProcess === 'VIDEOJET'
        ? 'Congelado'
        : currentProcess === 'PALLETIZING'
          ? 'Videojet'
          : 'Rend. preliminar'

  const currentLabel =
    currentProcess === 'FREEZING'
      ? 'Congelado'
      : currentProcess === 'VIDEOJET'
        ? 'Videojet'
        : currentProcess === 'PALLETIZING'
          ? 'Paletizado'
          : 'Objetivo'

  const differenceLabel = isDownstream ? 'Diferencia' : 'Kg faltantes'

  return (
    <>
      <colgroup>
        <col className="w-[22%] min-w-[13rem]" />
        <col className="w-[8.5%] min-w-[5.5rem]" />
        <col className="w-[8.5%] min-w-[5.5rem]" />
        <col className="w-[8.5%] min-w-[5.5rem]" />
        <col className="w-[8%] min-w-[5rem]" />
        <col className="w-[8%] min-w-[5rem]" />
        <col className="w-[8.5%] min-w-[5.5rem]" />
        <col className="w-[18%] min-w-[13.5rem]" />
        <col className="w-[3.5%] min-w-[3rem]" />
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
            {previousLabel}
          </th>
          <th scope="col" className="px-2.5 py-2.5 text-right leading-tight">
            {currentLabel}
          </th>
          <th scope="col" className="px-2.5 py-2.5 text-right leading-tight">
            {differenceLabel}
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
