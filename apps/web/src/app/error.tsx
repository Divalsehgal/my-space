"use client";

import { useEffect } from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          textAlign: "center",
          gap: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 4,
            bgcolor: "rgba(255, 0, 0, 0.03)",
            border: "1px solid rgba(255, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          
          <Typography variant="h3" color="error.main" gutterBottom>
            Something went wrong!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
            We encountered an unexpected error while rendering this page. 
            This could be due to a temporary issue or a malformed configuration.
          </Typography>

          {process.env.NODE_ENV === "development" && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "rgba(0,0,0,0.05)",
                borderRadius: 1,
                textAlign: "left",
                width: "100%",
                overflowX: "auto",
              }}
            >
              <Typography variant="caption" component="pre" sx={{ fontFamily: "monospace" }}>
                {error.stack || error.message}
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => reset()}
            startIcon={<RefreshIcon />}
            sx={{
              mt: 2,
              borderRadius: "50px",
              px: 4,
              py: 1.5,
              textTransform: "none",
            }}
          >
            Try again
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
