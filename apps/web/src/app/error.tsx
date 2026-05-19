"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";

import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            backdropFilter: "blur(10px)",
            boxShadow: "var(--t-colors-shadow-default)",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "24px",
              bgcolor: "var(--t-colors-background-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 48, color: "error.main" }} />
          </Box>

          <Box>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, mb: 1, letterSpacing: "-0.01em" }}
            >
              Something went wrong
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 450, mx: "auto", mb: 2 }}
            >
              We encountered an unexpected error. This might be a temporary
              glitch. If the problem persists, please try clearing your cache or
              contact support.
            </Typography>
          </Box>

          {process.env.NODE_ENV === "development" && (
            <Box
              sx={{
                p: 2,
                opacity: 0.4,
                borderRadius: 2,
                textAlign: "left",
                width: "100%",
                maxWidth: "600px",
                overflowX: "auto",
              }}
            >
              <Typography
                variant="caption"
                component="pre"
                sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
              >
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
              boxShadow: "0 8px 16px var(--t-colors-shadow-primary)",
              "&:hover": {
                boxShadow: "0 12px 24px var(--t-colors-shadow-primary)",
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
