"use client";

import Link from "next/link";
import { Box, Typography, Button, Container } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import styles from "./page.module.scss";

export default function NotFound() {
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
          gap: 3,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "6rem", md: "10rem" },
            fontWeight: 800,
            opacity: 0.1,
            position: "absolute",
            zIndex: -1,
          }}
        >
          404
        </Typography>
        
        <Typography variant="h2" gutterBottom>
          Oops! Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 2 }}>
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </Typography>

        <Button
          component={Link}
          href="/"
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          sx={{
            borderRadius: "50px",
            px: 4,
            py: 1.5,
            textTransform: "none",
            fontSize: "1.1rem",
            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
            "&:hover": {
              boxShadow: "0 12px 20px rgba(0,0,0,0.15)",
            },
          }}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
}
