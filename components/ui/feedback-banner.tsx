import { Alert, Snackbar } from "@mui/material";

interface FeedbackBannerProps {
  message: string | null;
  severity: "success" | "error";
  onClose: () => void;
}

export function FeedbackBanner({ message, severity, onClose }: FeedbackBannerProps) {
  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%", minWidth: 320 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
