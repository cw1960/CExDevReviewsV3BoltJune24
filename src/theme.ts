import { createTheme, MantineColorsTuple } from '@mantine/core'

const primaryColor: MantineColorsTuple = [
  '#e8f4fd',
  '#d1e7fb',
  '#a3cef7',
  '#72b4f3',
  '#4a9ef0',
  '#3292ee',
  '#228be8',
  '#1a7bd0',
  '#146eb9',
  '#0c5fa1'
]

const secondaryColor: MantineColorsTuple = [
  '#e6f7f4',
  '#ccede6',
  '#99dbd0',
  '#66c9ba',
  '#40b9a8',
  '#26b09d',
  '#1aa896',
  '#0f9481',
  '#08856f',
  '#00755c'
]

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: primaryColor,
    teal: secondaryColor
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.25rem', lineHeight: '1.3' },
      h2: { fontSize: '1.875rem', lineHeight: '1.3' },
      h3: { fontSize: '1.5rem', lineHeight: '1.4' }
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.875rem',
    md: '1.25rem',
    lg: '1.75rem',
    xl: '2.5rem'
  },
  radius: {
    xs: '0.375rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem'
  },
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)'
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md'
      }
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm'
      }
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        shadow: 'xl'
      }
    },
    TextInput: {
      defaultProps: {
        radius: 'md'
      }
    },
    PasswordInput: {
      defaultProps: {
        radius: 'md'
      }
    },
    Textarea: {
      defaultProps: {
        radius: 'md'
      }
    },
    Select: {
      defaultProps: {
        radius: 'md'
      }
    },
    MultiSelect: {
      defaultProps: {
        radius: 'md'
      }
    },
    NumberInput: {
      defaultProps: {
        radius: 'md'
      }
    },
    FileInput: {
      defaultProps: {
        radius: 'md'
      }
    }
  }
})