export interface BalancePanelTableHeaderProps {
  readonly isOutstandingView: boolean
}

export function BalancePanelTableHeader({
  isOutstandingView,
}: BalancePanelTableHeaderProps) {
  return (
    <>
      <colgroup>
        <col className="w-[48%]" />
        <col className="w-[13%]" />
        <col className="w-[13%]" />
        <col className="w-[13%]" />
        <col className="w-[13%]" />
      </colgroup>
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/90 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
          <th scope="col" className="px-4 py-2.5 sm:px-5">
            Producto
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            Generado
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            Procesado Día
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            Procesado Noche
          </th>
          <th
            scope="col"
            className="px-3 py-2.5 text-center align-middle text-brand-800"
          >
            {isOutstandingView ? 'Pendiente' : 'Saldo pendiente actual'}
          </th>
        </tr>
      </thead>
    </>
  )
}

