export interface ProductionDaysTableHeaderProps {
  readonly isFreezing: boolean
}

export function ProductionDaysTableHeader({
  isFreezing,
}: ProductionDaysTableHeaderProps) {
  return (
    <>
      <caption className="sr-only">Jornadas de producción registradas</caption>
      <colgroup>
        <col className="w-[14%]" />
        <col className="w-[11%]" />
        <col className="w-[12%]" />
        <col className="w-[10%]" />
        <col className="w-[9%]" />
        <col className="w-[17%]" />
        <col className="w-[15%]" />
        <col className="w-[12%]" />
      </colgroup>
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            Jornada
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            {isFreezing ? 'Día' : 'Materia prima'}
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            {isFreezing ? 'Noche' : 'Producto terminado'}
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            {isFreezing ? 'Total congelado' : 'Saldo final'}
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            {isFreezing ? 'Dif. trazabilidad' : 'Diferencia'}
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            {isFreezing ? 'Estado' : 'Cuadre'}
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            {isFreezing ? 'Vinculado' : 'Aprovechamiento'}
          </th>
          <th scope="col" className="px-3 py-2.5 text-center align-middle">
            Acción
          </th>
        </tr>
      </thead>
    </>
  )
}
