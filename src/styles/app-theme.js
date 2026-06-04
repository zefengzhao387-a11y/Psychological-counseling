import { theme } from 'antd'

export const appTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#ffffff',
    colorBgBase: '#0a0a0a',
    colorBgContainer: 'rgba(255, 255, 255, 0.04)',
    colorBgElevated: 'rgba(20, 20, 24, 0.96)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',
    colorText: 'rgba(255, 255, 255, 0.88)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.45)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 12,
    borderRadiusLG: 16,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  },
  components: {
    Button: {
      primaryColor: '#111111',
      colorPrimary: '#ffffff',
      colorPrimaryHover: 'rgba(255, 255, 255, 0.92)',
      colorPrimaryActive: 'rgba(255, 255, 255, 0.85)',
      defaultBg: 'rgba(255, 255, 255, 0.06)',
      defaultBorderColor: 'rgba(255, 255, 255, 0.12)',
      defaultColor: 'rgba(255, 255, 255, 0.85)',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(255, 255, 255, 0.1)',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
    },
    Table: {
      headerBg: 'rgba(255, 255, 255, 0.05)',
      rowHoverBg: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    Modal: {
      contentBg: 'rgba(16, 16, 20, 0.96)',
      headerBg: 'transparent',
      titleColor: 'rgba(255, 255, 255, 0.92)',
    },
    Card: {
      colorBgContainer: 'rgba(255, 255, 255, 0.04)',
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      activeBorderColor: 'rgba(255, 255, 255, 0.25)',
      hoverBorderColor: 'rgba(255, 255, 255, 0.18)',
    },
    Select: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      optionSelectedBg: 'rgba(255, 255, 255, 0.1)',
    },
    DatePicker: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
    },
  },
}
