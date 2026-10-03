import { Settings2, Sliders } from 'lucide-react'

const FAMILY_YIELD_TARGETS = [
  { family: 'Aleta Cruda', target: '80.0%' },
  { family: 'Manto Crudo', target: '75.0%' },
  { family: 'Anillas', target: '65.0%' },
  { family: 'Nuca Semilimpia', target: '70.0%' },
  { family: 'Rejos Crudo', target: '85.0%' },
] as const

const EFFICIENCY_BENCHMARKS = [
  { process: 'Línea Empaque (Directo)', benchmark: '120 Kg / persona-h' },
  { process: 'Línea Congelado (Túneles)', benchmark: '150 Kg / persona-h' },
  { process: 'Especialidades / Corte', benchmark: '85 Kg / persona-h' },
] as const

export function CatalogBenchmarksSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-200 dark:bg-slate-50/20">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Settings2 className="size-5 text-brand-600" />
          Metas de Rendimiento por Familia
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Porcentajes esperados de rendimiento teórico sobre materia prima procesada.
        </p>

        <div className="mt-4 space-y-3">
          {FAMILY_YIELD_TARGETS.map((item) => (
            <div
              key={item.family}
              className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-200"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-white">
                {item.family}
              </span>
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                {item.target}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-200 dark:bg-slate-50/20">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Sliders className="size-5 text-brand-600" />
          Benchmarks de Eficiencia Operativa
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Productividad objetivo por operario-hora en líneas de procesamiento.
        </p>

        <div className="mt-4 space-y-3">
          {EFFICIENCY_BENCHMARKS.map((item) => (
            <div
              key={item.process}
              className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-200"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-white">
                {item.process}
              </span>
              <span className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                {item.benchmark}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

