---
name: InputOTP
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-otp"
subcomponents: [InputOTPGroup, InputOTPSlot, InputOTPSeparator]
props:
  - maxLength?: number
  - value?: string
  - onChange?
  - children — Children components
  - textAlign?
  - onComplete?
  - pushPasswordManagerStrategy?
  - pasteTransformer?
  - containerClassName?: string — Custom class for the container element
  - noScriptCSSFallback?: string
  - key?
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - error?: boolean — Whether the input has an error state
  - ref? — Allows getting a ref to the component instance. Once the component unmounts, React will set `ref.current` to `null` (or call the ref with `null` if you passed a callback ref). @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
  - index: number — InputOTPSlot: The index of the slot in the OTP input
---

```jsx
<Field>
  <FieldLabel htmlFor="otp" dataHook="otp-label">Verification Code</FieldLabel>
  <InputOTPDigitsOnly
    id="otp"
    dataHook="verification-otp"
    maxLength={6}
  />
</Field>
```
```jsx
<Field>
  <FieldLabel htmlFor="otp" dataHook="otp-label">Enter Code</FieldLabel>
  <InputOTP id="otp" dataHook="custom-otp" maxLength={6} error={hasError}>
    <InputOTPGroup>
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} />
      <InputOTPSlot index={2} />
    </InputOTPGroup>
    <InputOTPSeparator />
    <InputOTPGroup>
      <InputOTPSlot index={3} />
      <InputOTPSlot index={4} />
      <InputOTPSlot index={5} />
    </InputOTPGroup>
  </InputOTP>
</Field>
```
```jsx
<InputOTPDigitsOnly
  aria-label="Verification code"
  dataHook="otp"
  maxLength={6}
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-inputotp--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
