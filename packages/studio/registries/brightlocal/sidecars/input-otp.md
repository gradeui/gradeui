---
name: InputOTP
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-otp"
subcomponents: [InputOTPGroup, InputOTPSlot, InputOTPSeparator]
props:
  - maxLength? — TODO(review): type + one-line description from src
  - pattern? — TODO(review): type + one-line description from src
  - error? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
