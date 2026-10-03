export interface ProductionBreakdownTableHeaderProps {
  readonly showTunnel: boolean
}

export function ProductionBreakdownTableHeader({
  showTunnel,
}: ProductionBreakdownTableHeaderProps) {
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
          scope="colgroup"
          colSpan={3}
          className="border-l-2 border-brand-200 bg-brand-50 px-2.5 py-2 text-center text-brand-800 md:sticky md:top-14 md:z-30 xl:top-0"
        >
          Turno Día
        </th>
        <th
          scope="colgroup"
          colSpan={3}
          className="border-l-2 border-slate-300 bg-slate-100 px-2.5 py-2 text-center text-slate-700 md:sticky md:top-14 md:z-30 xl:top-0"
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
        <th
          scope="colgroup"
          colSpan={5}
          className="border-l-2 border-brand-200 bg-brand-50 px-2.5 py-2 text-center text-brand-800 md:sticky md:top-14 md:z-30 xl:top-0"
        >
          Cuadre
        </th>
      </tr>
      <tr className="border-b border-slate-200 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
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
          className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
        >
          Propio
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
        <th
          scope="col"
          className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
        >
          Propio
        </th>
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
        <th
          scope="col"
          className="border-l-2 border-brand-200 bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
        >
          Ajustes
        </th>
        <th
          scope="col"
          className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
        >
          Tratamiento
        </th>
        <th
          scope="col"
          className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
        >
          Saldo al cierre
        </th>
        <th
          scope="col"
          className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
        >
          P. terminado
        </th>
        <th
          scope="col"
          className="bg-slate-50 px-4 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]"
        >
          Diferencia
        </th>
      </tr>
    </thead>
  )
}
