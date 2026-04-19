import { Box, Stack, Typography } from "@mui/material";

import { AdminNav } from "@/features/store-wallet/ui/admin-nav";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 1.5, sm: 2.5, lg: 3 },
        py: { xs: 1.5, sm: 2.5 },
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{
          minHeight: "calc(100vh - 24px)",
          maxWidth: 1320,
          mx: "auto",
        }}
      >
        <Box
          component="aside"
          sx={{
            width: { xs: "100%", lg: 250 },
            flexShrink: 0,
            p: 2,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, px: 1.25, pb: 2 }}>
            Teraid Pay
          </Typography>
          <AdminNav />
        </Box>

        <Box
          component="section"
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 2, md: 3 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
