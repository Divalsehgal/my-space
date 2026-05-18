import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import HomeIcon from "@mui/icons-material/Home";

export default function NotFoundComponent() {
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
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "8rem", md: "15rem" },
            fontWeight: 900,
            opacity: 0.03,
            position: "absolute",
            zIndex: -1,
            userSelect: "none",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          404
        </Typography>

        <Box sx={{ zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              mb: 2,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Lost in Space?
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 480,
              mb: 4,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            The page you&apos;re searching for seems to have vanished into the
            digital void. Let&apos;s get you back on track.
          </Typography>

          <Link href="/" style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              sx={{
                borderRadius: "50px",
                px: 6,
                py: 2,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Return to Home
            </Button>
          </Link>
        </Box>
      </Box>
    </Container>
  );
}
