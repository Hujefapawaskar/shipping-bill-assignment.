import { Input } from 'ui/inputs/input'

type InputProps = Parameters<typeof Input>[0]

// A plain type="number" input has step=1, so the browser rejects values like 0.5 and silently blocks submit
// (even for fields on a hidden tab). fe-zen-arch's Input forwards extra props to <input> but does not type `step`.
const anyStep = { step: 'any' } as unknown as Partial<InputProps>

/** Number input for amounts, rates, weights and quantities that may have decimals. */
export function DecimalInput(props: Omit<InputProps, 'type'>) {
  return <Input {...props} {...anyStep} type="number" />
}
