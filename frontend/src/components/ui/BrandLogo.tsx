export interface BrandLogoProps {
  className?: string
  compact?: boolean
  /**
   * 'seamless': Integrado directamente sobre el fondo del sidebar sin caja ni bordes (Opción 2).
   * 'card': Encapsulado en el marco estilizado con borde cian y fondo dark-glass.
   */
  variant?: 'card' | 'seamless'
  tone?: 'dark' | 'light' | 'auto'
}

const logoSeamlessUrl = `${import.meta.env.BASE_URL}brand/trabunda-logo-transparent.png?v=clean`

/**
 * BrandLogo:
 * Logo oficial completo de Trabunda Procesos Marinos procesado con Flood-Fill para remover
 * exclusivamente el fondo exterior blanco, manteniendo intacto el relleno blanco sólido de las letras,
 * las olas en azul cian y la cresta en rojo brillante. 100% íntegro, sin recortes ni fragmentaciones.
 */
export function BrandLogo({
  className = '',
  compact = false,
  variant = 'seamless',
}: BrandLogoProps) {
  if (variant === 'card') {
    return (
      <div
        className={`flex w-full items-center justify-center select-none ${className}`}
        aria-label="Trabunda Producción"
      >
        <div
          className={`relative flex items-center justify-center rounded-xl border border-sky-500/35 bg-gradient-to-r from-sky-950/40 via-slate-900/50 to-slate-950/70 shadow-[0_0_14px_rgba(14,165,233,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition-all hover:border-sky-400 hover:shadow-[0_0_18px_rgba(14,165,233,0.25)] ${
            compact ? 'size-10 p-1.5' : 'h-[3.5rem] w-full px-3.5 py-1.5'
          }`}
        >
          <img
            src={logoSeamlessUrl}
            alt="Trabunda Procesos Marinos"
            className="h-full w-auto max-h-10 max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      aria-label="Trabunda Producción"
    >
      <img
        src={logoSeamlessUrl}
        alt="Trabunda Procesos Marinos"
        className={`${
          compact ? 'h-7 w-auto' : 'h-10 w-auto max-w-[13.5rem]'
        } object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.02]`}
      />
    </div>
  )
}
