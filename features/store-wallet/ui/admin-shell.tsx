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
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        sx={{
          minHeight: "100vh",
        }}
      >
        <Box
          component="aside"
          sx={{
            width: { xs: "100%", lg: 250 },
            flexShrink: 0,
            p: 2,
            borderRight: "1px solid",
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
            bgcolor: "background.paper",
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
