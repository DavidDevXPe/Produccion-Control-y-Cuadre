export interface ProductionBreakdownTableHeaderProps {
  readonly showTunnel: boolean
  readonly hasPreviousBalances?: boolean
  readonly hasAdjustments?: boolean
}

export function ProductionBreakdownTableHeader({
  showTunnel,
  hasPreviousBalances = false,
  hasAdjustments = false,
}: ProductionBreakdownTableHeaderProps) {
  const isMultiRow = hasPreviousBalances || showTunnel

  if (!isMultiRow) {
    return (
      <thead>
        <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          <th
            scope="col"
            className="sticky-column-divider w-[20rem] bg-slate-50 px-4 py-3 text-left md:sticky md:top-14 md:z-50 lg:left-0 xl:top-0"
          >
            Familia / producto
          </th>
          <th
            scope="col"
            className="border-l-2 border-brand-200 bg-brand-50 px-2.5 py-3 text-right text-brand-800 md:sticky md:top-14 md:z-30 xl:top-0"
          >
            Turno Día
          </th>
          <th
            scope="col"
            className="border-l-2 border-slate-300 bg-slate-100 px-2.5 py-3 text-right text-slate-700 md:sticky md:top-14 md:z-30 xl:top-0"
          >
            Turno Noche
          </th>
          {hasAdjustments ? (
            <th
              scope="col"
              className="border-l-2 border-brand-200 bg-slate-50 px-2.5 py-3 text-right text-slate-500 md:sticky md:top-14 md:z-30 xl:top-0"
            >
              Ajustes
            </th>
          ) : null}
          <th
            scope="col"
            className={`${hasAdjustments ? '' : 'border-l-2 border-brand-200 '}bg-slate-50 px-2.5 py-3 text-right text-slate-500 md:sticky md:top-14 md:z-30 xl:top-0`}
          >
            Tratamiento
          </th>
          <th
            scope="col"
            className="bg-slate-50 px-2.5 py-3 text-right text-slate-500 md:sticky md:top-14 md:z-30 xl:top-0"
          >
            Saldo al cierre
          </th>
          <th
            scope="col"
            className="bg-slate-50 px-2.5 py-3 text-right text-slate-900 md:sticky md:top-14 md:z-30 xl:top-0"
          >
            P. terminado
          </th>
          <th
            scope="col"
            className="bg-slate-50 px-4 py-3 text-right text-slate-500 md:sticky md:top-14 md:z-30 xl:top-0"
          >
            Diferencia
          </th>
        </tr>
      </thead>
    )
  }

  return (
    <thead>
      <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
        <th
          scope="col"
          rowSpan={2}
          className="sticky-column-divider w-[20rem] bg-slate-50 px-4 py-3 text-left align-bottom md:sticky md:top-14 md:z-50 lg:left-0 xl:top-0"
        >
          Familia / producto
        </th>
        <th
          scope={hasPreviousBalances ? 'colgroup' : 'col'}
          colSpan={hasPreviousBalances ? 2 : 1}
          rowSpan={hasPreviousBalances ? 1 : 2}
          className={`border-l-2 border-brand-200 bg-brand-50 px-2.5 ${hasPreviousBalances ? 'py-2 text-center' : 'py-3 text-right'} text-brand-800 align-bottom md:sticky md:top-14 md:z-30 xl:top-0`}
        >
          Turno Día
        </th>
        <th
          scope={hasPreviousBalances ? 'colgroup' : 'col'}
          colSpan={hasPreviousBalances ? 2 : 1}
          rowSpan={hasPreviousBalances ? 1 : 2}
          className={`border-l-2 border-slate-300 bg-slate-100 px-2.5 ${hasPreviousBalances ? 'py-2 text-center' : 'py-3 text-right'} text-slate-700 align-bottom md:sticky md:top-14 md:z-30 xl:top-0`}
        >
          Turno Noche
        </th>
        {showTunnel ? (
          <th
            scope="colgroup"
            colSpan={2}
            className="border-l-2 border-violet-200 bg-violet-50 px-2.5 py-2 text-center text-violet-800 md:sticky md:top-14 md:z-30 xl:top-0"
          >
            Túnel
          </th>
        ) : null}
        {hasAdjustments ? (
          <th
            scope="col"
            rowSpan={2}
            className="border-l-2 border-brand-200 bg-slate-50 px-2.5 py-3 text-right text-slate-500 align-bottom md:sticky md:top-14 md:z-30 xl:top-0"
          >
            Ajustes
          </th>
        ) : null}
        <th
          scope="col"
          rowSpan={2}
          className={`${hasAdjustments ? '' : 'border-l-2 border-brand-200 '}bg-slate-50 px-2.5 py-3 text-right text-slate-500 align-bottom md:sticky md:top-14 md:z-30 xl:top-0`}
        >
          Tratamiento
        </th>
        <th
          scope="col"
          rowSpan={2}
          className="bg-slate-50 px-2.5 py-3 text-right text-slate-500 align-bottom md:sticky md:top-14 md:z-30 xl:top-0"
        >
          Saldo al cierre
        </th>
        <th
          scope="col"
          rowSpan={2}
          className="bg-slate-50 px-2.5 py-3 text-right text-slate-900 align-bottom md:sticky md:top-14 md:z-30 xl:top-0"
        >
          P. terminado
        </th>
        <th
          scope="col"
          rowSpan={2}
          className="bg-slate-50 px-4 py-3 text-right text-slate-500 align-bottom md:sticky md:top-14 md:z-30 xl:top-0"
        >
          Diferencia
        </th>
      </tr>
      <tr className="border-b border-slate-200 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
        {hasPreviousBalances ? (
          <>
            <th
              scope="col"
              className="border-l-2 border-brand-200 bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
            >
              Reportado
            </th>
            <th
              scope="col"
              className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
            >
              Saldo ant.
            </th>
            <th
              scope="col"
              className="border-l-2 border-slate-300 bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
            >
              Reportado
            </th>
            <th
              scope="col"
              className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
            >
              Saldo ant.
            </th>
          </>
        ) : null}
        {showTunnel ? (
          <>
            <th
              scope="col"
              className="border-l-2 border-violet-200 bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
            >
              Día
            </th>
            <th
              scope="col"
              className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
            >
              Noche
            </th>
          </>
        ) : null}
      </tr>
    </thead>
  )
}
