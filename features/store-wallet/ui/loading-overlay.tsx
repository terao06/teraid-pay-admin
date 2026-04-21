import { Backdrop, CircularProgress, Typography, Stack } from "@mui/material";

interface LoadingOverlayProps {
  open: boolean;
  label?: string;
}

export function LoadingOverlay({ open, label }: LoadingOverlayProps) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
        color: "#fff",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <CircularProgress color="inherit" />
      {label ? (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      ) : null}
    </Backdrop>
  );
}
