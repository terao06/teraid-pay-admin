import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    primary: {
      main: "#18a97b",
      light: "#55c7a4",
      dark: "#0d7c5a",
    },
    secondary: {
      main: "#6c63ff",
      light: "#918aff",
      dark: "#4c43d6",
    },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#172033",
      secondary: "#697386",
    },
    divider: "#e7ebf2",
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "var(--font-body), sans-serif",
    h1: {
      fontFamily: "var(--font-heading), sans-serif",
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h2: {
      fontFamily: "var(--font-heading), sans-serif",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: "var(--font-heading), sans-serif",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "var(--font-heading), sans-serif",
      fontWeight: 750,
      letterSpacing: "-0.025em",
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 18,
          minHeight: 42,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: "#e7ebf2",
          boxShadow: "0 10px 30px rgba(23, 32, 51, 0.045)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },
  },
});
