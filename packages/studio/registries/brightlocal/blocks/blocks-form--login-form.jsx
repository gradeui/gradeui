// Blocks/Form — Login Form
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-form--login-form
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    layout: "fullscreen"
  },
  render: () => <SplitLayout dataHook="login-split-layout">
      <SplitLayoutContentLeft>
        <LoginFormComponent />
      </SplitLayoutContentLeft>
      <SplitLayoutContentRight>
        <MarketingContentComponent />
      </SplitLayoutContentRight>
    </SplitLayout>
}
