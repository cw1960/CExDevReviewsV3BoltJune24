import { createTheme } from "@mantine/core";

const primaryColor = [
  "#e8f4fd",
  "#d1e7fb",
  "#a3cef7",
  "#72b4f3",
  "#4a9ef0",
  "#3292ee",
  "#228be8",
  "#1a7bd0",
  "#146eb9",
  "#0c5fa1",
];

const secondaryColor = [
  "#e6f7f4",
  "#ccede6",
  "#99dbd0",
  "#66c9ba",
  "#40b9a8",
  "#26b09d",
  "#1aa896",
  "#0f9481",
  "#08856f",
  "#00755c",
];

// Enhanced gradient and glass-morphism utilities for use in components
export const gradients = {
  primary: "linear-gradient(135deg, #3292ee 0%, #1a7bd0 100%)",
  secondary: "linear-gradient(135deg, #26b09d 0%, #0f9481 100%)",
  success: "linear-gradient(135deg, #40c057 0%, #2f9e44 100%)",
  warning: "linear-gradient(135deg, #fd7e14 0%, #e8590c 100%)",
  danger: "linear-gradient(135deg, #fa5252 0%, #e03131 100%)",
  light: "linear-gradient(135deg, #f8f9fc 0%, #e9ecef 100%)",
  dark: "linear-gradient(135deg, #495057 0%, #343a40 100%)",
  glassmorphism: "rgba(255, 255, 255, 0.1)",
  glassmorphismDark: "rgba(0, 0, 0, 0.1)",
  pageBackground:
    "linear-gradient(135deg, #f8f9fc 0%, #e9ecef 25%, #f1f5f9 50%, #e2e8f0 75%, #f8fafc 100%)",
  pageBackgroundDark:
    "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)",
};

// Animation utilities for use in components
export const animations = {
  fadeIn:
    "transition: all 0.2s ease-in-out; &:hover { transform: translateY(-2px); }",
  scaleOnHover:
    "transition: all 0.2s ease-in-out; &:hover { transform: scale(1.02); }",
  glowOnHover:
    "transition: all 0.3s ease-in-out; &:hover { box-shadow: 0 0 20px rgba(50, 146, 238, 0.3); }",
};

export const theme = createTheme({
  primaryColor: "blue",
  colors: {
    blue: primaryColor,
    teal: secondaryColor,
  },
  fontFamily: "Inter, system-ui, sans-serif",
  headings: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "2.25rem", lineHeight: "1.3" },
      h2: { fontSize: "1.875rem", lineHeight: "1.3" },
      h3: { fontSize: "1.5rem", lineHeight: "1.4" },
    },
  },
  spacing: {
    xs: "0.5rem",
    sm: "0.875rem",
    md: "1.25rem",
    lg: "1.75rem",
    xl: "2.5rem",
  },
  radius: {
    xs: "0.375rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
  },
  shadows: {
    xs: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",
    sm: "0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
    md: "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)",
    xl: "0 16px 48px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.12)",
    // Enhanced colored shadows for special use
    primary:
      "0 8px 24px rgba(50, 146, 238, 0.15), 0 4px 8px rgba(50, 146, 238, 0.1)",
    secondary:
      "0 8px 24px rgba(38, 176, 157, 0.15), 0 4px 8px rgba(38, 176, 157, 0.1)",
    success:
      "0 8px 24px rgba(64, 192, 87, 0.15), 0 4px 8px rgba(64, 192, 87, 0.1)",
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
      },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
        shadow: "xl",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Textarea: {
      defaultProps: {
        radius: "md",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
    },
    MultiSelect: {
      defaultProps: {
        radius: "md",
      },
    },
    NumberInput: {
      defaultProps: {
        radius: "md",
      },
    },
    FileInput: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});
