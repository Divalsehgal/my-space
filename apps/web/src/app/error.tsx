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
          minHeight: "75vh",
          textAlign: "center",
          gap: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 8 },
            borderRadius: 6,
            bgcolor: "rgba(255, 99, 71, 0.02)",
            border: "1px solid rgba(255, 99, 71, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "24px",
              bgcolor: "rgba(255, 99, 71, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 48, color: "error.main" }} />
          </Box>
          
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, letterSpacing: "-0.01em" }}>
              Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 2 }}>
              We encountered an unexpected error. This might be a temporary glitch. 
              If the problem persists, please try clearing your cache or contact support.
            </Typography>
          </Box>

          {process.env.NODE_ENV === "development" && (
            <Box
              sx={{
                p: 2,
                bgcolor: "rgba(0,0,0,0.4)",
                borderRadius: 2,
                textAlign: "left",
                width: "100%",
                maxWidth: "600px",
                overflowX: "auto",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Typography variant="caption" component="pre" sx={{ fontFamily: "monospace", color: "#ffa726", fontSize: "0.75rem" }}>
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
              borderRadius: "50px",
              px: 6,
              py: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              boxShadow: "0 8px 16px rgba(250, 129, 18, 0.2)",
              "&:hover": {
                boxShadow: "0 12px 24px rgba(250, 129, 18, 0.3)",
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            Attempt Recovery
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
